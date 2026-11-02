import { PDFDocument, rgb } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { unicodeFontkit } from '../shotlists/pdf/unicode-font';
import { wrapCell } from '../shotlists/pdf/spreadsheet';
import { stableJSON, validateFlow } from './model';
export type FlowPrint = {
  product: 'master' | 'department' | 'rundown';
  paper: 'letter' | 'a4' | 'tabloid' | 'a3';
  orientation: 'landscape' | 'portrait';
  departments: string[];
  style: 'color' | 'mono';
  actual: boolean;
  personnel: boolean;
  notes: boolean;
};
export async function renderFlow(
  state: any,
  source: any,
  raw: FlowPrint,
): Promise<Buffer> {
  validateFlow(state);
  if (
    !raw ||
    !['master', 'department', 'rundown'].includes(raw.product) ||
    !['letter', 'a4', 'tabloid', 'a3'].includes(raw.paper) ||
    !['landscape', 'portrait'].includes(raw.orientation) ||
    !['color', 'mono'].includes(raw.style) ||
    !Array.isArray(raw.departments) ||
    new Set(raw.departments).size !== raw.departments.length ||
    raw.departments.some((id) => !state.departments[id])
  )
    throw Error('Choose valid print settings.');
  if (
    ['actual', 'personnel', 'notes'].some(
      (k) => typeof (raw as any)[k] !== 'boolean',
    )
  )
    throw Error('Choose valid included fields.');
  const departments = (Object.values(state.departments) as any[])
    .filter((d) => !d.removedAt && raw.departments.includes(d.id))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  if (raw.product === 'department' && departments.length !== 1)
    throw Error('Choose one department for Department Focus.');
  const events = (Object.values(state.events) as any[])
    .filter((e) => !e.deletedAt)
    .sort(
      (a, b) =>
        (a.start ? Date.parse(a.start) : Infinity) -
          (b.start ? Date.parse(b.start) : Infinity) ||
        a.order - b.order ||
        a.id.localeCompare(b.id),
    );
  const rows = events.filter((e) =>
    raw.product === 'rundown'
      ? e.type !== 'department'
      : raw.product === 'department'
        ? e.type === 'milestone' ||
          departments.some((d) =>
            String(state.instructions[e.id + ':' + d.id]?.text || '').trim(),
          )
        : true,
  );
  if (!rows.length) throw Error('There are no events in this print scope.');
  if (rows.length * Math.max(1, departments.length) > 60000)
    throw Error(
      'This output exceeds 60,000 table cells. Choose a smaller department scope.',
    );
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(unicodeFontkit);
  const font = await pdf.embedFont(
    readFileSync(join(__dirname, '../../assets/fonts/DejaVuSans.ttf')),
    { subset: true },
  );
  const dims = {
      letter: [612, 792],
      a4: [595.28, 841.89],
      tabloid: [792, 1224],
      a3: [841.89, 1190.55],
    }[raw.paper],
    [W, H] = raw.orientation === 'landscape' ? [dims[1], dims[0]] : dims;
  const margin = 26,
    usable = W - 2 * margin,
    size = 8.5,
    leading = 11.6,
    timeWidth = 67,
    actionWidth =
      raw.product === 'rundown'
        ? usable - timeWidth
        : Math.min(220, usable * 0.27),
    departmentWidth = W >= 1100 ? 92 : 115;
  const count =
      raw.product === 'rundown'
        ? 0
        : Math.max(
            1,
            Math.floor((usable - timeWidth - actionWidth) / departmentWidth),
          ),
    bands: any[][] = [];
  if (!count) bands.push([]);
  else if (!departments.length) throw Error('Choose at least one department.');
  else {
    let band: any[] = [];
    for (let i = 0; i < departments.length; ) {
      let end = i + 1;
      while (
        departments[i].group &&
        end < departments.length &&
        departments[end].group === departments[i].group
      )
        end++;
      const group = departments.slice(i, end);
      for (let j = 0; j < group.length; j += count) {
        const part = group.slice(j, j + count);
        if (band.length && band.length + part.length > count) {
          bands.push(band);
          band = [];
        }
        band.push(...part);
      }
      i = end;
    }
    if (band.length) bands.push(band);
  }
  const format = (v: string) => {
    if (!v) return 'Unscheduled';
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: state.meta.zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(v));
    const part = (key: string) =>
      parts.find((p) => p.type === key)?.value || '';
    const date = `${part('year')}-${part('month')}-${part('day')}`;
    return (
      `${part('hour')}:${part('minute')}` +
      (date !== state.meta.date ? '\n' + date : '')
    );
  };
  const shotFor = (e: any) =>
    e.sourceListId === state.meta.listId && source
      ? source.shots[e.shotId]
      : undefined;
  const dur = (e: any) =>
    e.duration != null
      ? e.duration
      : shotFor(e) &&
          !shotFor(e).deleted &&
          shotFor(e).estimatedMinutes !== '' &&
          shotFor(e).estimatedMinutes != null &&
          Number.isFinite(Number(shotFor(e).estimatedMinutes)) &&
          Number(shotFor(e).estimatedMinutes) >= 0
        ? Number(shotFor(e).estimatedMinutes)
        : null;
  const texts = rows.map((e) => {
    const shot = shotFor(e),
      valid = shot && !shot.deleted && !shot.deletedAt;
    return [
      format(e.start) +
        (raw.actual && e.actualStart
          ? '\nActual ' + format(e.actualStart)
          : '') +
        (raw.actual && e.actualEnd ? '\nDone ' + format(e.actualEnd) : ''),
      [
        e.type === 'shot'
          ? valid
            ? String(shot.number) + ' ' + String(shot.subject || '')
            : String(e.reference || 'Shot') + ' · source unavailable'
          : '',
        e.description,
        valid ? String(shot.coverage || '') : '',
        dur(e) != null
          ? `${dur(e)} min${e.duration == null ? ' · inherited' : ''}`
          : '',
        raw.notes ? e.notes : '',
      ]
        .filter(Boolean)
        .join('\n'),
      ...departments.map((d) =>
        String(state.instructions[e.id + ':' + d.id]?.text || ''),
      ),
    ];
  });
  const supported = new Set(font.getCharacterSet());
  for (const value of [
    state.meta.name,
    ...departments.flatMap((d) => [d.name, d.personnel]),
    ...texts.flat(),
  ])
    for (const char of String(value || ''))
      if (!/[\r\n\t]/.test(char) && !supported.has(char.codePointAt(0)!))
        throw Error(
          `The PDF font does not support “${char}”. Update this text before printing.`,
        );
  const widths = bands.map((ds) => [
    timeWidth,
    actionWidth,
    ...ds.map(() => (usable - timeWidth - actionWidth) / ds.length),
  ]);
  const lines = bands.map((ds, bi) =>
    texts.map((text) =>
      [
        text[0],
        text[1],
        ...ds.map((d) => text[2 + departments.findIndex((x) => x.id === d.id)]),
      ].map((v, i) => wrapCell(v, widths[bi][i] - 12, font, size)),
    ),
  );
  const titleLines = wrapCell(String(state.meta.name), usable - 150, font, 15);
  const docHeader = 52 + titleLines.length * 19;
  const bandHeadings = bands.map((ds, bi) =>
    [
      'Time',
      'Current Action',
      ...ds.map(
        (d) =>
          (d.group ? d.group + '\n' : '') +
          d.name.replaceAll('/', ' / ') +
          (raw.personnel && d.personnel ? '\n' + d.personnel : ''),
      ),
    ].map((v, i) => wrapCell(v, widths[bi][i] - 12, font, 8)),
  );
  const headerHeight = Math.max(
    ...bandHeadings.map((c) => Math.max(...c.map((l) => l.length)) * 10.5 + 12),
  );
  const bodyHeight = H - docHeader - headerHeight - margin - 24;
  if (bodyHeight < 60)
    throw Error(
      'These headings need more page space. Choose larger paper or shorter personnel headings.',
    );
  const maxLines = rows.map((_, ri) =>
      Math.max(1, ...lines.flatMap((b) => b[ri].map((c) => c.length))),
    ),
    capacity = Math.floor((bodyHeight - 14) / leading);
  // A common row fragmentation plan is shared by every department band.
  const fragments = rows.flatMap((e, ri) => {
    const out: {
      ri: number;
      offset: number;
      length: number;
      continued: boolean;
    }[] = [];
    for (let offset = 0; offset < maxLines[ri]; offset += capacity)
      out.push({
        ri,
        offset,
        length: Math.min(capacity, maxLines[ri] - offset),
        continued: offset > 0,
      });
    return out;
  });
  const pages: (typeof fragments)[] = [];
  let current: typeof fragments = [],
    used = 0;
  for (const f of fragments) {
    const h = f.length * leading + 14;
    if (current.length && used + h > bodyHeight) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(f);
    used += h;
  }
  if (current.length) pages.push(current);
  if (pages.length * bands.length > 2000)
    throw Error(
      'This output exceeds the 2,000-page safety limit. Choose a smaller department scope.',
    );
  const revision = createHash('sha256')
      .update(stableJSON({ state, source }))
      .digest('hex')
      .slice(0, 10),
    ink = rgb(0.07, 0.12, 0.16),
    rule = rgb(0.77, 0.82, 0.84);
  for (let vi = 0; vi < pages.length; vi++)
    for (let bi = 0; bi < bands.length; bi++) {
      const page = pdf.addPage([W, H]);
      const draw = (text: string, x: number, y: number, fontSize = size) =>
        page.drawText(text, { x, y, size: fontSize, font, color: ink });
      titleLines.forEach((t, i) => draw(t, margin, H - 30 - i * 19, 15));
      draw('WHITEOUT / FLOW OF THE DAY', W - margin - 150, H - 28, 8);
      draw(
        `${state.meta.date || 'Date unconfirmed'} · ${state.meta.zone} · ${raw.product === 'master' ? 'Master Departmental Flow' : raw.product === 'department' ? 'Department Focus' : 'Daily Rundown · condensed'}`,
        margin,
        H - docHeader + 24,
        8,
      );
      draw(
        `Revision ${revision} · ${state.meta.status || 'draft'}`,
        margin,
        H - docHeader + 10,
        8,
      );
      let y = H - docHeader,
        x = margin;
      const headingLines = bandHeadings[bi],
        headH = headerHeight;
      page.drawRectangle({
        x: margin,
        y: y - headH,
        width: usable,
        height: headH,
        color: rgb(0.92, 0.95, 0.96),
      });
      headingLines.forEach((ls, i) => {
        ls.forEach((t, j) => draw(t, x + 6, y - 12 - j * 10.5, 8));
        x += widths[bi][i];
      });
      y -= headH;
      // Header height is measured. Reserve it from each page, never paint over body.
      for (const f of pages[vi]) {
        const e = rows[f.ri],
          h = f.length * leading + 14;
        if (y - h < margin + 24)
          throw Error(
            'Department heading is unusually long. Shorten personnel headings or select larger paper.',
          );
        if (e.type === 'milestone')
          page.drawRectangle({
            x: margin,
            y: y - h,
            width: usable,
            height: h,
            color:
              raw.style === 'mono'
                ? rgb(0.94, 0.94, 0.94)
                : rgb(0.89, 0.95, 0.97),
          });
        x = margin;
        lines[bi][f.ri].forEach((ls, i) => {
          const visible = ls.slice(f.offset, f.offset + f.length);
          visible.forEach((t, j) => draw(t, x + 6, y - 12 - j * leading));
          page.drawLine({
            start: { x, y },
            end: { x, y: y - h },
            thickness: 0.3,
            color: rule,
          });
          x += widths[bi][i];
        });
        if (f.continued) draw('(continued)', W - margin - 57, y - 8, 6);
        y -= h;
        page.drawLine({
          start: { x: margin, y },
          end: { x: W - margin, y },
          thickness: 0.4,
          color: rule,
        });
      }
      draw(
        `Section ${bi + 1}/${bands.length} · ${bands[bi].map((d) => d.name).join(' / ') || 'Daily Rundown'}`.slice(
          0,
          160,
        ),
        margin,
        20,
        7,
      );
      draw(
        `Range ${vi + 1}/${pages.length} · Page ${vi * bands.length + bi + 1}/${pages.length * bands.length}`,
        W - margin - 135,
        20,
        7,
      );
    }
  pdf.setTitle(String(state.meta.name));
  pdf.setSubject(`Flow revision ${revision}`);
  pdf.setCreationDate(new Date('2026-01-01T00:00:00Z'));
  pdf.setModificationDate(new Date('2026-01-01T00:00:00Z'));
  return Buffer.from(await pdf.save());
}

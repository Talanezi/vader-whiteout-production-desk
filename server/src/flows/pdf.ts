import {linkedTalent} from './talent';
import { resolveSchedule, clockText, sourceLabel } from './scheduling';
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
  productionLog?:boolean;
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
    .sort(
      (a, b) =>
        raw.departments.indexOf(a.id) - raw.departments.indexOf(b.id),
    );
  if (raw.product === 'department' && departments.length !== 1)
    throw Error('Choose one department for Department Focus.');
  const resolved = resolveSchedule(state, source),
    events = resolved.events;
  const rows = events.filter((e) =>
    raw.product === 'rundown'
      ? e.type !== 'department'
      : raw.product === 'department'
      ? e.type !== 'department' ||
        e.departmentId === departments[0]?.id ||
        departments.some((d) =>
          String(state.instructions[e.id + ':' + d.id]?.text || '').trim(),
        )
      : true,
  );
  if (!rows.length)
    throw Error('There are no events in this print scope.');
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
    departmentWidth = W >= 1100 ? 80 : 115;
  const count =
      raw.product === 'rundown'
        ? 0
        : Math.max(
            1,
            Math.floor(
              (usable - timeWidth - actionWidth) / departmentWidth,
            ),
          ),
    bands: any[][] = [];
  if (!count) bands.push([]);
  else if (!departments.length)
    throw Error('Choose at least one department.');
  else {
    // Balanced, contiguous bands avoid an orphan final department. Ten normal
    // departments fit one Tabloid landscape width without reducing 8.5pt text.
    const bandCount=Math.ceil(departments.length/count), perBand=Math.ceil(departments.length/bandCount);
    for(let i=0;i<departments.length;i+=perBand)bands.push(departments.slice(i,i+perBand));
  }
  const format = (e: any) =>
    clockText(e.minute) + (e.minute >= 1440 ? '\nNext day' : '');
  const shotFor = (e: any) =>
    e.sourceListId === state.meta.listId && source
      ? source.shots[e.shotId]
      : undefined;
  const dur = (e:any)=>e.effectiveDuration??null;
  const texts = rows.map((e) => {
    const shot = shotFor(e),
      valid = shot && !shot.deleted && !shot.deletedAt;
    return [
      format(e),
      [
        e.type === 'shot'
          ? valid
            ? sourceLabel(shot, source) +
              (shot.labelConflict
                ? ' · code conflict [' + String(e.shotId).slice(0, 8) + ']'
                : '')
            : String(e.reference || 'Shot') + ' · source unavailable'
          : '',
        e.category,
        e.description,
        valid ? String(shot.coverage || '') : '',
        dur(e) != null ? `${dur(e)} min` : '',
        raw.notes ? e.notes : '',
      ]
        .filter(Boolean)
        .join('\n'),
      ...departments.map((d) =>
        (() => {
          const i = resolved.instructions.find(
            (i: any) => i.eventId === e.id && i.departmentId === d.id,
          );
          return [
            /^(talent|actors?|cast)$/i.test(d.name.trim())?linkedTalent(e,valid?shot:null,state.cast).map(p=>p.roleOrDepartment||p.name).join(', '):'',
            i?.minute != null
              ? clockText(i.minute) +
                (i.minute >= 1440 ? ' · Next day' : '') +
                (i.duration != null ? ' · ' + i.duration + ' min' : '')
              : '',
            i?.text || '',
          ]
            .filter(Boolean)
            .join('\n');
        })(),
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
  const widths = bands.map((ds)=>{
    const available=usable-timeWidth-actionWidth,min=ds.length?Math.min(80,available/ds.length):0;
    const weights=ds.map(d=>{const column=2+departments.findIndex(x=>x.id===d.id);const samples=texts.map(t=>font.widthOfTextAtSize(String(t[column]||'').replace(/\n/g,' '),size)).sort((a,b)=>a-b);return Math.min(180,Math.max(40,font.widthOfTextAtSize(d.name,8),samples[Math.floor(samples.length*.7)]||0))});
    const sum=weights.reduce((n,v)=>n+v,0)||1,extra=available-min*ds.length;
    return [timeWidth,actionWidth,...weights.map(v=>min+extra*v/sum)];
  });
  const lines = bands.map((ds, bi) =>
    texts.map((text) =>
      [
        text[0],
        text[1],
        ...ds.map(
          (d) => text[2 + departments.findIndex((x) => x.id === d.id)],
        ),
      ].map((v, i) => wrapCell(v, widths[bi][i] - 12, font, size)),
    ),
  );
  const customTitle=String(state.meta.name||'').replace(/^Flow of the Day\s*(?:[-–—:]\s*)?/i,'').trim();
  const printedTitle='Flow of the Day'+(customTitle?' — '+customTitle:'');
  const titleLines = wrapCell(printedTitle, usable, font, 15);
  const docHeader = 36 + titleLines.length * 19;
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
    ...bandHeadings.map(
      (c) => Math.max(...c.map((l) => l.length)) * 10.5 + 12,
    ),
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
  const pages: typeof fragments[] = [];
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
      draw(
        state.meta.date
          ? new Intl.DateTimeFormat('en-US', {
              timeZone: 'UTC',
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(state.meta.date + 'T12:00:00Z'))
          : 'Shoot date not set',
        margin,
        H - docHeader + 12,
        9,
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
                : /lunch|break/i.test(e.description || e.category || '')
                ? rgb(0.97, 0.94, 0.88)
                : /wrap/i.test(e.description || e.category || '')
                ? rgb(0.9, 0.93, 0.92)
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
      draw(String(vi * bands.length + bi + 1), W - margin - 12, 20, 8);
    }
  if(raw.productionLog){
    const records=Object.values(state.meta.liveState?.blocks||{}) as any[];
    let page:any,y=0;const heading=()=>{page=pdf.addPage([W,H]);y=H-margin;page.drawText(printedTitle+' — Production log',{x:margin,y:y-12,size:13,font,color:ink});y-=36;page.drawText('Activity / Actual start / Actual finish / Elapsed / DP estimate / AD allotted / Budget variance',{x:margin,y,size:9,font,color:ink});y-=24};heading();
    for(const b of records.sort((a,b)=>(a.startedAt||Infinity)-(b.startedAt||Infinity))){
      const elapsed=b.status==='completed'?(b.endedAt-b.startedAt)/60000:null;
      const text=[b.label,b.status==='skipped'?'Skipped':clockText(b.startMinute),b.status==='active'?'In progress':b.status==='skipped'?'—':clockText(b.endMinute),elapsed==null?'—':elapsed.toFixed(1)+' min',b.estimate==null?'—':b.estimate+' min',b.allotted==null?'—':b.allotted+' min',elapsed!=null&&b.kind==='shot'&&b.allotted!=null?(elapsed-b.allotted).toFixed(1)+' min':'—'].join(' / ');
      for(const line of wrapCell(text,usable,font,size)){if(y<margin+25)heading();page.drawText(line,{x:margin,y,size,font,color:ink});y-=leading}y-=12;
    }
    if(!records.length)page.drawText('No recorded production blocks.',{x:margin,y,size,font,color:ink});
    for(const audit of state.meta.liveState?.audit||[]){if(!['correct','undo'].includes(audit.type))continue;for(const line of wrapCell(`${audit.type} · ${audit.by.name} · ${new Date(audit.at).toISOString()} · ${audit.reason||'Previous action restored'}`,usable,font,size)){if(y<margin+25)heading();page.drawText(line,{x:margin,y,size,font,color:ink});y-=leading}y-=8}
    pdf.getPages().slice(pages.length*bands.length).forEach((p,i)=>p.drawText(String(pages.length*bands.length+i+1),{x:W-margin-12,y:20,font,size:8,color:ink}));
  }
  pdf.setTitle(printedTitle);
  pdf.setSubject('Production-day schedule');
  pdf.setCreationDate(new Date('2026-01-01T00:00:00Z'));
  pdf.setModificationDate(new Date('2026-01-01T00:00:00Z'));
  return Buffer.from(await pdf.save());
}

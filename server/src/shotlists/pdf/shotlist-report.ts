import * as Y from 'yjs';
export type ReportRecord = Record<string, unknown>;
export type ShotSnapshot = {
  meta: ReportRecord;
  scenes: Record<string, ReportRecord>;
  shots: Record<string, ReportRecord>;
  shootDays: Record<string, ReportRecord>;
  shootAssignments: Record<string, ReportRecord>;
};
export type PrintOptions = {
  mode?: 'creative' | 'shooting' | 'both';
  paper?: 'letter' | 'a4';
  profile?: 'compact' | 'standard' | 'detailed';
  notes?: boolean;
  summaries?: boolean;
  sceneIds?: string[];
  dayIds?: string[];
  orderIds?: string[];
};
export function snapshot(doc: Y.Doc): ShotSnapshot {
  return Object.fromEntries(
    ['meta', 'scenes', 'shots', 'shootDays', 'shootAssignments'].map((k) => [
      k,
      doc.getMap(k).toJSON(),
    ]),
  ) as ShotSnapshot;
}
const sorted = (records: Record<string, ReportRecord>) =>
  Object.values(records)
    .filter((r) => !r.deleted)
    .sort(
      (a, b) =>
        (Number(a.order) || 0) - (Number(b.order) || 0) ||
        String(a.id).localeCompare(String(b.id)),
    );
const text = (r: ReportRecord, k: string) => String(r?.[k] ?? '');
export function metadata(data: ShotSnapshot) {
  const scenes = sorted(data.scenes),
    sceneIds = new Set(scenes.map((s) => s.id)),
    shots = sorted(data.shots).filter((s) => sceneIds.has(s.sceneId)),
    shotIds = new Set(shots.map((s) => s.id)),
    days = sorted(data.shootDays),
    dayIds = new Set(days.map((d) => d.id)),
    assigned = sorted(data.shootAssignments).filter(
      (a) => shotIds.has(a.shotId) && dayIds.has(a.dayId),
    ),
    dates = [
      ...new Set(
        assigned
          .map((a) => text(data.shootDays[String(a.dayId)], 'date'))
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
      ),
    ].sort();
  return {
    sceneCount: scenes.length,
    shotCount: shots.length,
    scheduledShotCount: new Set(assigned.map((a) => a.shotId)).size,
    dates,
  };
}
const escape = (s: string) =>
  s.replace(
    /[\\{}%$&#_^~]/g,
    (c) =>
      ({
        '\\': '\\textbackslash{}',
        '{': '\\{',
        '}': '\\}',
        '%': '\\%',
        $: '\\$',
        '&': '\\&',
        '#': '\\#',
        _: '\\_',
        '^': '\\textasciicircum{}',
        '~': '\\textasciitilde{}',
      })[c]!,
  );
/** Only text enters this boundary; no source text can become a command or path. */
export function tex(value: unknown) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .split(/(\n|\S{32,})/)
    .map((part) =>
      part === '\n'
        ? '\\newline{}'
        : part.length >= 32 && !/\s/.test(part)
          ? (part.match(/.{1,8}/gu) || []).map(escape).join('\\allowbreak{}')
          : escape(part),
    )
    .join('');
}
export function buildShotLatex(data: ShotSnapshot, options: PrintOptions = {}) {
  data = {
    ...data,
    shots: Object.fromEntries(
      Object.entries(data.shots).map(([id, shot]) => {
        const n = String(shot.number || ''),
          scene = String(data.scenes[String(shot.sceneId)]?.number || '');
        return [
          id,
          {
            ...shot,
            number:
              scene && /^[A-Za-z]+$/.test(n)
                ? `${scene}-${n}${Object.values(data.shots).some((other) => other.id !== shot.id && !other.deleted && other.sceneId === shot.sceneId && other.number === `${scene}-${n}`) ? ` [${n}]` : ''}`
                : n,
          },
        ];
      }),
    ),
  };
  const o = {
    mode: 'creative',
    paper: 'letter',
    profile: 'standard',
    notes: true,
    summaries: true,
    ...options,
  };
  if (
    !['creative', 'shooting', 'both'].includes(o.mode) ||
    !['letter', 'a4'].includes(o.paper) ||
    !['compact', 'standard', 'detailed'].includes(o.profile)
  )
    throw Error('Choose a valid report configuration.');
  for (const filter of [o.sceneIds, o.dayIds])
    if (
      filter &&
      (!Array.isArray(filter) ||
        filter.length > 100 ||
        filter.some((id) => typeof id !== 'string' || id.length > 80))
    )
      throw Error('Invalid report selection.');
  const allScenes = sorted(data.scenes),
    sceneIds = new Set(allScenes.map((s) => s.id)),
    allShots = sorted(data.shots).filter((s) => sceneIds.has(s.sceneId)),
    selectedScenes = allScenes.filter(
      (s) => !o.sceneIds?.length || o.sceneIds.includes(String(s.id)),
    ),
    allowed = new Set(selectedScenes.map((s) => s.id)),
    selectedShots = allShots.filter((s) => allowed.has(s.sceneId)),
    liveDays = sorted(data.shootDays).filter(
      (d) => !o.dayIds?.length || o.dayIds.includes(String(d.id)),
    ),
    shotIds = new Set(selectedShots.map((s) => s.id)),
    assignments = sorted(data.shootAssignments).filter(
      (a) => shotIds.has(a.shotId) && liveDays.some((d) => d.id === a.dayId),
    );
  if (allShots.length > 5000)
    throw Error('Export supports up to 5,000 shots. Select fewer scenes.');
  if (o.mode !== 'creative' && !assignments.length)
    throw Error(
      'Assign shots to a shooting day before exporting Shooting Order.',
    );
  let budget = 0;
  for (const row of selectedShots)
    for (const value of Object.values(row)) {
      const text = String(value ?? '');
      if (text.length > 20000)
        throw Error(
          'A report field exceeds 20,000 characters. Shorten it or select other scenes.',
        );
      budget += text.length;
      if (budget > 2_000_000)
        throw Error(
          'Report text exceeds the safety budget. Select fewer scenes or omit long notes.',
        );
    }
  const total = (rows: ReportRecord[], key = 'estimatedMinutes') =>
    rows
      .reduce(
        (n, r) =>
          n +
          (Number.isFinite(Number(r[key])) && Number(r[key]) > 0
            ? Number(r[key])
            : 0),
        0,
      )
      .toLocaleString('en-US', { maximumFractionDigits: 1 });
  const heading = (title: string, summary: string) =>
    `\\section*{${tex(title)}}\\noindent{\\color{muted}\\small ${tex(summary)}}\\par\\vspace{4pt}`;
  const table = (
    title: string,
    rows: {
      shot: ReportRecord;
      order?: number;
      notes?: string;
      estimate?: string;
      status?: string;
    }[],
  ) => {
    const head =
      o.profile === 'compact'
        ? 'Shot & Coverage & Camera & Est. min'
        : 'Shot & Coverage & Camera / framing & Lens / movement & Est. min';
    const columns =
      o.profile === 'compact'
        ? '{P{.10\\linewidth}P{.65\\linewidth}P{.10\\linewidth}R{.07\\linewidth}}'
        : '{P{.10\\linewidth}P{.43\\linewidth}P{.15\\linewidth}P{.17\\linewidth}R{.07\\linewidth}}';
    let result = `\\begin{longtable}${columns}\n\\multicolumn{${o.profile === 'compact' ? 4 : 5}}{P{.94\\linewidth}}{\\bfseries ${tex(title)}}\\\\[3pt]\\toprule ${head} \\\\ \\midrule\\endfirsthead\n\\multicolumn{${o.profile === 'compact' ? 4 : 5}}{P{.94\\linewidth}}{\\small ${tex(title)} — continued}\\\\[3pt]\\toprule ${head} \\\\ \\midrule\\endhead\\midrule\\endfoot\\bottomrule\\endlastfoot\n`;
    for (const row of rows) {
      const s = row.shot,
        coverage = text(s, 'coverage'),
        chunks = coverage.match(/[\s\S]{1,550}(?:\s|$)|[\s\S]{1,550}/g) || [''];
      chunks.forEach((part, i) => {
        const identity =
            (row.order !== undefined ? `${row.order}. ` : '') +
            (text(s, 'number').length > 90
              ? text(s, 'number').slice(0, 87) + '…'
              : text(s, 'number')) +
            (i ? ' (cont.)' : ''),
          estimate = row.estimate || text(s, 'estimatedMinutes');
        result +=
          (o.profile === 'compact'
            ? [
                tex(identity),
                tex(part),
                i ? '' : tex(text(s, 'camera')),
                i ? '' : tex(estimate),
              ]
            : [
                tex(identity),
                tex(part),
                i
                  ? ''
                  : tex(
                      [text(s, 'camera'), text(s, 'framing')]
                        .filter(Boolean)
                        .join(' · '),
                    ),
                i
                  ? ''
                  : tex(
                      [text(s, 'lens'), text(s, 'movement')]
                        .filter(Boolean)
                        .join(' · '),
                    ),
                i ? '' : tex(estimate),
              ]
          ).join(' & ') + ' \\\\ \n';
      });
      const details: string[] = [];
      if (text(s, 'number').length > 90)
        details.push('Full shot ID: ' + text(s, 'number'));
      if (o.profile === 'detailed')
        for (const [key, label] of [
          ['subject', 'Subject'],
          ['angle', 'Angle'],
          ['equipment', 'Support'],
          ['scriptSeconds', 'Script sec'],
          ['setupMinutes', 'Setup min'],
          ['plannedTakes', 'Planned takes'],
          ['actualTakes', 'Actual / best take'],
        ])
          if (text(s, key)) details.push(label + ': ' + text(s, key));
      if (o.notes)
        for (const [key, label] of [
          ['notes', 'Camera'],
          ['focusNotes', 'Focus'],
          ['lightingNotes', 'Lighting'],
        ])
          if (text(s, key)) details.push(label + ': ' + text(s, key));
      if (row.notes) details.push('Schedule: ' + row.notes);
      if (row.status) details.push('Status: ' + row.status);
      const detail = details.join('   ·   ');
      for (let i = 0; i < detail.length; i += 650)
        result += `\\multicolumn{${o.profile === 'compact' ? 4 : 5}}{P{.94\\linewidth}}{\\footnotesize\\color{muted}${tex(text(s, 'number').slice(0, 90) + ': ' + detail.slice(i, i + 650))}} \\\\ \n`;
      result += '\\addlinespace[3pt]';
    }
    return result + '\\end{longtable}\n';
  };
  let body = heading(
    String(data.meta.name || 'Shot list'),
    `${selectedScenes.length} scenes · ${selectedShots.length} shots · ${total(selectedShots)} min estimated`,
  );
  const dates = metadata(data).dates;
  if (dates.length)
    body += `\\noindent{\\small Planned shooting: ${tex(dates[0])}${dates.length > 1 ? ' — ' + tex(dates[dates.length - 1]) : ''}}\\par\n`;
  if (o.mode !== 'shooting') {
    body += '\\subsection*{Creative Shot List}\n';
    const runs: { scene: ReportRecord; rows: ReportRecord[] }[] = [];
    if (o.orderIds) {
      if (!Array.isArray(o.orderIds) || o.orderIds.length > 5000)
        throw Error('Invalid report ordering.');
      for (const id of o.orderIds) {
        const shot = selectedShots.find((shot) => shot.id === id);
        if (!shot) continue;
        const scene = data.scenes[String(shot.sceneId)],
          previous = runs[runs.length - 1];
        if (previous?.scene.id === scene.id) previous.rows.push(shot);
        else runs.push({ scene, rows: [shot] });
      }
    } else
      selectedScenes.forEach((scene) =>
        runs.push({
          scene,
          rows: selectedShots.filter((shot) => shot.sceneId === scene.id),
        }),
      );
    for (const { scene, rows } of runs) {
      const title = `Scene ${text(scene, 'number')}${text(scene, 'title') ? ' · ' + text(scene, 'title') : ''}`;
      if (!rows.length) continue;
      body += table(
        title,
        rows.map((shot) => ({ shot })),
      );
      if (o.summaries)
        body += `\\noindent{\\small\\color{muted}${rows.length} shots · ${tex(total(rows))} min estimated}\\par\n`;
    }
  }
  if (o.mode !== 'creative') {
    if (o.mode === 'both') body += '\\clearpage\n';
    body += '\\subsection*{Shooting Order}\n';
    for (const day of liveDays) {
      const rows = assignments
        .filter((a) => a.dayId === day.id)
        .map((a, i) => ({
          shot: data.shots[String(a.shotId)],
          order: i + 1,
          notes: text(a, 'notes'),
          estimate: text(a, 'estimatedMinutes'),
          status: text(a, 'status'),
        }));
      if (!rows.length) continue;
      body += table(
        `${text(day, 'date')} · ${text(day, 'title') || 'Shoot day'}`,
        rows,
      );
      body += `\\noindent{\\small ${rows.length} assignments · ${tex(total(rows.map((r) => ({ ...r.shot, estimatedMinutes: r.estimate || r.shot.estimatedMinutes }))))} min estimated}\\par\n`;
    }
  }
  const source = String.raw`\documentclass[10pt,${o.paper === 'a4' ? 'a4paper' : 'letterpaper'},landscape]{article}
\usepackage[margin=12mm,includeheadfoot,headheight=14pt,headsep=7pt,footskip=18pt]{geometry}
\usepackage{fontspec}\setmainfont{DejaVuSans.ttf}[BoldFont=DejaVuSans-Bold.ttf,ItalicFont=DejaVuSans-Oblique.ttf,BoldItalicFont=DejaVuSans-BoldOblique.ttf]
\usepackage{longtable,array,booktabs,xcolor,fancyhdr,lastpage}
\definecolor{muted}{HTML}{52616A}\definecolor{ink}{HTML}{14202A}
\newcolumntype{P}[1]{>{\raggedright\arraybackslash}p{#1}}\newcolumntype{R}[1]{>{\raggedleft\arraybackslash}p{#1}}
\pagestyle{fancy}\fancyhf{}\fancyhead[L]{\scriptsize WHITEOUT / PRODUCTION DESK}\fancyhead[R]{\scriptsize ${tex(o.mode === 'shooting' ? 'SHOOTING ORDER' : 'SHOT LIST')}}\fancyfoot[R]{\scriptsize\thepage\ / \pageref{LastPage}}
\renewcommand{\headrulewidth}{.25pt}\setlength{\parindent}{0pt}\setlength{\tabcolsep}{3pt}\setlength{\LTpre}{4pt}\setlength{\LTpost}{6pt}\renewcommand{\arraystretch}{1.12}\setlength{\emergencystretch}{3em}
\begin{document}\color{ink}\fontsize{${o.profile === 'compact' ? 8.5 : 9}}{${o.profile === 'compact' ? 11 : 12}}\selectfont
${body}
\end{document}`;
  if (Buffer.byteLength(source) > 3 * 1024 * 1024)
    throw Error('Report is too large. Select fewer scenes or omit long notes.');
  return source;
}

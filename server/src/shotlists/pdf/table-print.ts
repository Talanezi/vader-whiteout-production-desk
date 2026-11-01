import {
  buildShotLatex,
  tex,
  type ShotSnapshot,
  type ReportRecord,
  type PrintOptions,
} from './shotlist-report';
export type PrintField =
  | 'number'
  | 'scene'
  | 'coverage'
  | 'camera'
  | 'framing'
  | 'subject'
  | 'angle'
  | 'lens'
  | 'equipment'
  | 'movement'
  | 'notes'
  | 'focusNotes'
  | 'lightingNotes'
  | 'scriptSeconds'
  | 'setupMinutes'
  | 'plannedTakes'
  | 'estimatedMinutes'
  | 'actualTakes'
  | 'sequence'
  | 'assignmentNotes'
  | 'assignmentStatus'
  | 'shootDates'
  | 'assignmentCount'
  | 'scheduleStatus';
export type PrintReference = { shotId: string; assignmentId?: string };
export type TablePrintSpec = {
  version: 2;
  scope: 'entire' | 'current' | 'selected' | 'area' | 'scenes' | 'day';
  layout: 'table' | 'report';
  rows: PrintReference[];
  columns: { field: PrintField; width: number }[];
  sceneIds?: string[];
  dayId?: string;
  paper: 'letter' | 'a4';
  orientation: 'landscape' | 'portrait';
  margins: 'normal' | 'narrow';
  scaling: 'fit-width' | 'actual' | 'readable';
  text: 'wrap' | 'single-line';
  groupScenes: boolean;
  report?: PrintOptions;
};
export const printFields: Record<PrintField, string> = {
  number: 'Shot',
  scene: 'Scene',
  coverage: 'Coverage',
  camera: 'Camera',
  framing: 'Framing',
  subject: 'Subject',
  angle: 'Angle',
  lens: 'Lens',
  equipment: 'Support',
  movement: 'Movement',
  notes: 'Camera notes',
  focusNotes: 'Focus notes',
  lightingNotes: 'Lighting notes',
  scriptSeconds: 'Script sec',
  setupMinutes: 'Setup min',
  plannedTakes: 'Takes',
  estimatedMinutes: 'Est. min',
  actualTakes: 'Actual / best',
  sequence: 'Order',
  assignmentNotes: 'Schedule notes',
  assignmentStatus: 'Status',
  shootDates: 'Shoot dates',
  assignmentCount: 'Assignments',
  scheduleStatus: 'Schedule status',
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function invalid(message: string): never {
  throw Error(message);
}
export function validatePrintSpec(raw: TablePrintSpec) {
  if (
    !raw ||
    raw.version !== 2 ||
    !['entire', 'current', 'selected', 'area', 'scenes', 'day'].includes(
      raw.scope,
    ) ||
    !['table', 'report'].includes(raw.layout) ||
    !['letter', 'a4'].includes(raw.paper) ||
    !['portrait', 'landscape'].includes(raw.orientation) ||
    !['normal', 'narrow'].includes(raw.margins) ||
    !['fit-width', 'actual', 'readable'].includes(raw.scaling) ||
    !['wrap', 'single-line'].includes(raw.text) ||
    typeof raw.groupScenes !== 'boolean'
  )
    invalid('Choose a valid print configuration.');
  if (
    !Array.isArray(raw.rows) ||
    (!raw.rows.length && !['entire', 'current'].includes(raw.scope)) ||
    raw.rows.length > 5000
  )
    invalid('Choose between 1 and 5,000 printable rows.');
  const references = new Set<string>();
  for (const row of raw.rows) {
    if (
      !row ||
      !uuid.test(row.shotId) ||
      (row.assignmentId !== undefined && !uuid.test(row.assignmentId))
    )
      invalid('Invalid print-area row reference.');
    const key = row.assignmentId || row.shotId;
    if (references.has(key))
      invalid('The print area contains a repeated row reference.');
    references.add(key);
  }
  if (
    !Array.isArray(raw.columns) ||
    !raw.columns.length ||
    raw.columns.length > 24
  )
    invalid('Choose printable columns.');
  const seen = new Set<string>();
  for (const column of raw.columns) {
    if (
      !column ||
      !(column.field in printFields) ||
      !Object.prototype.hasOwnProperty.call(printFields, column.field) ||
      !Number.isFinite(column.width) ||
      column.width < 40 ||
      column.width > 1200 ||
      seen.has(column.field)
    )
      invalid('Invalid or repeated print column.');
    seen.add(column.field);
  }
  if (
    raw.sceneIds &&
    (!Array.isArray(raw.sceneIds) ||
      raw.sceneIds.length > 100 ||
      raw.sceneIds.some((id) => !uuid.test(id)))
  )
    invalid('Invalid scene selection.');
  if (raw.scope === 'day' && (!raw.dayId || !uuid.test(raw.dayId)))
    invalid('Choose a shoot day.');
  return raw;
}
export function resolvePrintArea(data: ShotSnapshot, raw: TablePrintSpec) {
  const spec = validatePrintSpec(raw);
  if (
    !spec.rows.length &&
    Object.values(data.shots).some((shot) => !shot.deleted)
  )
    invalid(
      'There are no rows in this print area. Choose shots or a different scope.',
    );
  const rows = spec.rows.map((reference, index) => {
    const shot = data.shots[reference.shotId],
      scene = shot && data.scenes[String(shot.sceneId)],
      assignment = reference.assignmentId
        ? data.shootAssignments[reference.assignmentId]
        : undefined;
    if (!shot || shot.deleted || !scene || scene.deleted)
      invalid(
        'A selected shot is no longer available. Refresh the print selection.',
      );
    if (
      reference.assignmentId &&
      (!assignment ||
        assignment.deleted ||
        assignment.shotId !== reference.shotId ||
        !data.shootDays[String(assignment.dayId)] ||
        data.shootDays[String(assignment.dayId)].deleted)
    )
      invalid(
        'A selected day assignment is no longer available. Refresh the print selection.',
      );
    if (
      spec.scope === 'day' &&
      (!assignment || assignment.dayId !== spec.dayId)
    )
      invalid('Print rows must belong to the selected shoot day.');
    if (
      spec.scope === 'scenes' &&
      (!spec.sceneIds?.length || !spec.sceneIds.includes(String(shot.sceneId)))
    )
      invalid('Print rows must belong to the selected scenes.');
    return { reference, shot, scene, assignment, index, data };
  });
  const columns = spec.columns.some((c) => c.field === 'number')
    ? spec.columns
    : [{ field: 'number' as const, width: 106 }, ...spec.columns];
  let budget = 0;
  for (const row of rows)
    for (const column of columns) {
      const value = printValue(row, column.field);
      if (value.length > 20000)
        invalid(
          'A selected field exceeds 20,000 characters. Choose a smaller print area.',
        );
      budget += value.length;
      if (budget > 2_000_000)
        invalid(
          'The selected print area exceeds the 2 MB text budget. Choose fewer rows or fields.',
        );
    }
  return { spec, rows, columns };
}
type PrintRow = {
  reference: PrintReference;
  shot: ReportRecord;
  scene: ReportRecord;
  assignment?: ReportRecord;
  index: number;
  data: ShotSnapshot;
};
export function printValue(row: PrintRow, field: PrintField) {
  if (['shootDates', 'assignmentCount', 'scheduleStatus'].includes(field)) {
    const records = Object.values(row.data.shootAssignments).filter(
      (assignment) =>
        !assignment.deleted &&
        assignment.shotId === row.shot.id &&
        row.data.shootDays[String(assignment.dayId)] &&
        !row.data.shootDays[String(assignment.dayId)].deleted,
    );
    if (field === 'assignmentCount') return String(records.length);
    if (field === 'scheduleStatus')
      return [
        ...new Set(
          records.map((record) => String(record.status || '')).filter(Boolean),
        ),
      ].join(', ');
    return records.length
      ? [
          ...new Set(
            records.map((record) =>
              String(row.data.shootDays[String(record.dayId)].date || ''),
            ),
          ),
        ]
          .sort()
          .join(', ')
      : 'Not scheduled';
  }
  if (field === 'scene') return String(row.scene.number ?? '');
  if (field === 'sequence') return String(row.index + 1);
  if (field === 'assignmentNotes') return String(row.assignment?.notes ?? '');
  if (field === 'assignmentStatus') return String(row.assignment?.status ?? '');
  if (field === 'estimatedMinutes' && row.assignment?.estimatedMinutes)
    return String(row.assignment.estimatedMinutes);
  return String(row.shot[field] ?? '');
}
export function computePrintLayout(
  spec: TablePrintSpec,
  columns: TablePrintSpec['columns'],
) {
  const dimensions = spec.paper === 'a4' ? [595.28, 841.89] : [612, 792],
    page =
      spec.orientation === 'landscape'
        ? [dimensions[1], dimensions[0]]
        : dimensions,
    margin = ((spec.margins === 'narrow' ? 8 : 12) * 72) / 25.4,
    available = page[0] - 2 * margin,
    padding = 2.4,
    baseFont = spec.scaling === 'readable' ? 9.5 : 9,
    desired = columns.map((c) => ({
      field: c.field,
      width: Math.max(
        c.field === 'number' ? 58 : 34,
        c.width * (spec.scaling === 'actual' ? 0.75 : 0.65),
      ),
    }));
  const scale = Math.min(
    1,
    (available - 2 * padding * desired.length) /
      desired.reduce((n, c) => n + c.width, 0),
  );
  if (spec.scaling === 'fit-width' && baseFont * scale < 8)
    invalid(
      'These columns cannot fit one page wide at readable type. Choose Readable pages, landscape, narrower margins, or fewer columns.',
    );
  const bands: (typeof desired)[] = [];
  if (spec.scaling === 'fit-width') {
    const ratio =
      (available - 2 * padding * desired.length) /
      desired.reduce((n, c) => n + c.width, 0);
    bands.push(desired.map((c) => ({ ...c, width: c.width * ratio })));
  } else {
    const identity = desired.find((c) => c.field === 'number')!,
      other = desired.filter((c) => c.field !== 'number');
    let band = [identity],
      width = identity.width + 2 * padding;
    for (const column of other) {
      const bounded = {
        ...column,
        width: Math.min(column.width, available - identity.width - 4 * padding),
      };
      if (width + bounded.width + 2 * padding > available && band.length > 1) {
        bands.push(band);
        band = [identity];
        width = identity.width + 2 * padding;
      }
      band.push(bounded);
      width += bounded.width + 2 * padding;
    }
    bands.push(band);
  }
  return {
    page,
    margin,
    padding,
    font: spec.scaling === 'fit-width' ? baseFont * scale : baseFont,
    bands,
    available,
  };
}
/** Split long cells into bounded continuation rows; never let a single TeX row exceed a page. */
function pieces(value: string, width: number, font: number) {
  const parts: string[] = [];
  const capacity = Math.max(4, Math.floor(width / (font * 0.92)));
  let part = '',
    column = 0,
    lines = 1;
  for (const character of value
    .replace(/\r\n?/g, '\n')
    .replace(/\n{2,}/g, '\n')) {
    part += character;
    if (character === '\n') {
      lines++;
      column = 0;
    } else if (++column >= capacity) {
      lines++;
      column = 0;
    }
    if (
      lines >= 18 &&
      (character === ' ' || character === '\n' || part.length >= capacity * 20)
    ) {
      parts.push(part);
      part = '';
      column = 0;
      lines = 1;
    }
  }
  if (part || !parts.length) parts.push(part);
  return parts;
}
function cellTex(value: string) {
  return value
    .split(/(\s+)/)
    .map((token) =>
      /\s/.test(token)
        ? tex(token)
        : token.length > 6
          ? (token.match(/.{1,3}/gu) || [])
              .map(tex)
              .join('\\penalty1000\\hskip0pt{}')
          : tex(token),
    )
    .join('');
}
export function buildTablePrint(data: ShotSnapshot, raw: TablePrintSpec) {
  const { spec, rows, columns } = resolvePrintArea(data, raw);
  if (spec.layout === 'report') {
    const selected = new Set(rows.map((r) => r.reference.shotId)),
      assignments = Object.fromEntries(
        rows
          .filter((r) => r.assignment)
          .map((r, index) => [
            r.reference.assignmentId!,
            { ...r.assignment!, order: index * 1024 },
          ]),
      ),
      filtered: ShotSnapshot = {
        ...data,
        scenes: Object.fromEntries(
          Object.entries(data.scenes).filter(([id]) =>
            rows.some((row) => row.shot.sceneId === id),
          ),
        ),
        shots: Object.fromEntries(
          rows.map((row, index) => [
            row.reference.shotId,
            { ...row.shot, order: index * 1024 },
          ]),
        ),
        shootAssignments:
          spec.scope === 'day'
            ? assignments
            : Object.fromEntries(
                Object.entries(data.shootAssignments).filter(([, a]) =>
                  selected.has(String(a.shotId)),
                ),
              ),
      };
    return {
      source: buildShotLatex(filtered, {
        ...spec.report,
        mode:
          spec.scope === 'day' ? 'shooting' : spec.report?.mode || 'creative',
        orderIds: rows.map((row) => row.reference.shotId),
        paper: spec.paper,
        sceneIds: spec.scope === 'scenes' ? spec.sceneIds : undefined,
      })
        .replace('landscape]{article}', spec.orientation + ']{article}')
        .replace(
          'margin=12mm',
          `margin=${spec.margins === 'narrow' ? 8 : 12}mm`,
        ),
      rows: rows.length,
      bands: 1,
    };
  }
  const layout = computePrintLayout(spec, columns),
    scopeName = {
      entire: 'Entire Shot List',
      current: 'Current View',
      selected: 'Selected Shots',
      area: 'Selected Area',
      scenes: 'Selected Scenes',
      day: 'Shooting Order',
    }[spec.scope],
    title = String(data.meta.name || 'Shot list').slice(0, 180),
    day = spec.dayId ? data.shootDays[spec.dayId] : undefined;
  let body = '';
  for (let b = 0; b < layout.bands.length; b++) {
    const band = layout.bands[b];
    if (b) body += '\\clearpage\n';
    body += `\\noindent{\\bfseries ${tex(title)}}\\hfill{\\small ${tex(scopeName)} · ${rows.length} rows}\\par\n`;
    if (day) body += `{\\small ${tex(day.date)} · ${tex(day.title)}}\\par\n`;
    if (layout.bands.length > 1)
      body += `{\\footnotesize\\color{muted}Column band ${b + 1} of ${layout.bands.length} · down, then across · shot identity repeats}\\par\n`;
    if (spec.text === 'single-line')
      body +=
        '\\noindent{\\footnotesize\\color{muted}Compact preview: selected text cells are shortened to one line; shot IDs remain complete. This is not a full-text export.}\\par\n';
    const columnSpec = band.map((c) => `P{${c.width.toFixed(2)}pt}`).join(''),
      head = band.map((c) => tex(printFields[c.field])).join(' & '),
      spanWidth =
        band.reduce((n, c) => n + c.width + 2 * layout.padding, 0) -
        2 * layout.padding;
    body += `\\begin{longtable}{${columnSpec}}\\toprule ${head} \\\\ \\midrule\\endfirsthead\\toprule ${head} \\\\ \\midrule\\endhead\\midrule\\endfoot\\bottomrule\\endlastfoot\n`;
    let lastScene: unknown;
    for (const row of rows) {
      if (spec.groupScenes && row.shot.sceneId !== lastScene) {
        body += `\\multicolumn{${band.length}}{P{${spanWidth.toFixed(2)}pt}}{\\color{muted}\\footnotesize\\bfseries Scene ${tex(row.scene.number)}${row.scene.title ? ' · ' + tex(row.scene.title) : ''}} \\\\*[2pt]\n`;
        lastScene = row.shot.sceneId;
      }
      const values = band.map((column) => printValue(row, column.field)),
        chunks = values.map((value, i) =>
          spec.text === 'single-line' && band[i].field !== 'number'
            ? [value.replace(/\s+/g, ' ').slice(0, 1000)]
            : pieces(value, band[i].width, layout.font),
        ),
        height = Math.max(...chunks.map((c) => c.length));
      for (let part = 0; part < height; part++) {
        body +=
          band
            .map((column, index) => {
              let value = chunks[index][part] || '';
              if (column.field === 'number' && part > 0 && !value)
                value = String(row.shot.number ?? '').slice(0, 32) + ' (cont.)';
              if (spec.text === 'single-line' && column.field !== 'number')
                return `\\truncate{${column.width.toFixed(2)}pt}{${tex(value)}}`;
              return cellTex(value);
            })
            .join(' & ') + ' \\\\ \n';
      }
      body += '\\hline\n';
    }
    body += '\\end{longtable}\n';
  }
  const source = String.raw`\documentclass[10pt,${spec.paper === 'a4' ? 'a4paper' : 'letterpaper'},${spec.orientation}]{article}
\usepackage[margin=${((layout.margin / 72) * 25.4).toFixed(2)}mm,includeheadfoot,headheight=12pt,headsep=7pt,footskip=16pt]{geometry}
\usepackage{fontspec}\setmainfont{DejaVuSans.ttf}[BoldFont=DejaVuSans-Bold.ttf,ItalicFont=DejaVuSans-Oblique.ttf]
\usepackage{longtable,array,booktabs,xcolor,fancyhdr,lastpage,truncate}
\definecolor{muted}{HTML}{52616A}\definecolor{ink}{HTML}{14202A}
\newcolumntype{P}[1]{>{\raggedright\arraybackslash}p{#1}}
\pagestyle{fancy}\fancyhf{}\fancyhead[L]{\scriptsize WHITEOUT / PRODUCTION DESK}\fancyhead[R]{\scriptsize TABLE PRINT}\fancyfoot[R]{\scriptsize\thepage\ / \pageref{LastPage}}
\renewcommand{\headrulewidth}{.2pt}\setlength{\parindent}{0pt}\setlength{\tabcolsep}{${layout.padding}pt}\setlength{\LTpre}{5pt}\setlength{\LTpost}{4pt}\renewcommand{\arraystretch}{1.12}\setlength{\emergencystretch}{3em}
\begin{document}\setlength{\LTleft}{0pt}\setlength{\LTright}{\fill}\color{ink}\fontsize{${layout.font.toFixed(2)}}{${(layout.font * 1.3).toFixed(2)}}\selectfont
${body}
\end{document}`;
  if (Buffer.byteLength(source) > 3 * 1024 * 1024)
    invalid(
      'The print area exceeds the typesetting budget. Select fewer rows or fields.',
    );
  return {
    source,
    rows: rows.length,
    bands: layout.bands.length,
    font: layout.font,
  };
}

import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import { unicodeFontkit } from './unicode-font';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolvePrintArea,
  printValue,
  printFields,
  TablePrintSpec,
} from './table-print';
import type { ShotSnapshot } from './shotlist-report';

/** Geometry is computed from the embedded font before any cells are drawn. */
export function wrapCell(
  value: string,
  width: number,
  font: PDFFont,
  size: number,
): string[] {
  const result: string[] = [];
  for (const char of value.replace(/[\r\n\t]/g, ''))
    if (font.widthOfTextAtSize(char, size) > width)
      throw Error(
        'A selected column is too narrow for its text. Widen the column, choose fewer fields or use horizontal tiling.',
      );
  for (const paragraph of value.replace(/\r\n?/g, '\n').split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
        continue;
      }
      if (line) result.push(line);
      line = '';
      for (const ch of word) {
        if (line && font.widthOfTextAtSize(line + ch, size) > width) {
          result.push(line);
          line = '';
        }
        line += ch;
      }
    }
    result.push(line);
  }
  return result;
}
export async function renderSpreadsheet(
  data: ShotSnapshot,
  raw: TablePrintSpec,
): Promise<Buffer> {
  const { spec, rows, columns } = resolvePrintArea(data, raw);
  const dimensions = {
    letter: [612, 792],
    a4: [595.28, 841.89],
    a3: [841.89, 1190.55],
    tabloid: [792, 1224],
  }[spec.paper];
  const [pageW, pageH] =
    spec.orientation === 'landscape' ? [...dimensions].reverse() : dimensions;
  const margin = spec.margins === 'narrow' ? 22.68 : 34.02,
    available = pageW - margin * 2;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(unicodeFontkit);
  const font = await pdf.embedFont(
    readFileSync(join(__dirname, '../../../assets/fonts/DejaVuSans.ttf')),
    { subset: true },
  );
  const supported = new Set(font.getCharacterSet());
  const values = rows.map((row) =>
    columns.map((c) => printValue(row, c.field)),
  );
  for (const text of [
    ...values.flat(),
    String(data.meta.name || ''),
    ...(spec.groupScenes
      ? rows.map(
          (row) =>
            String(row.scene.number || '') +
            ' ' +
            String(row.scene.title || ''),
        )
      : []),
  ])
    for (const char of text)
      if (!/[\r\n\t]/.test(char) && !supported.has(char.codePointAt(0)!))
        throw Error(
          `The PDF font does not support “${char}”. Choose supported text before exporting.`,
        );
  const logical = columns.map((c) => c.width * 0.75),
    total = logical.reduce((a, b) => a + b, 0);
  const identity = columns.findIndex((c) => c.field === 'number');
  // Oversized on-screen identity columns must not leave negative-width page bands.
  if (spec.scaling !== 'fit-width')
    logical[identity] = Math.min(logical[identity], available / 2);
  const baseSize =
    spec.scaling === 'fit-width'
      ? columns.length > 12
        ? 4.2
        : columns.length > 9
          ? 6
          : 8
      : 8;
  const size =
    spec.scaling === 'fit-width'
      ? baseSize * Math.min(1, available / 724)
      : baseSize;
  if (size < 4)
    throw Error(
      'These columns require text below the Scene 05 reference size. Choose larger paper, fewer columns or horizontal tiling.',
    );
  const pad = Math.max(1.2, (2 * size) / 8),
    leading = size * 1.22;
  const bands: number[][] = [];
  if (spec.scaling === 'fit-width') bands.push(columns.map((_, i) => i));
  else {
    const identity = columns.findIndex((c) => c.field === 'number');
    let band = [identity],
      width = logical[identity];
    for (let i = 0; i < columns.length; i++) {
      if (i === identity) continue;
      if (
        width + Math.min(logical[i], available - logical[identity]) >
          available &&
        band.length > 1
      ) {
        bands.push(band);
        band = [identity];
        width = logical[identity];
      }
      band.push(i);
      width += Math.min(logical[i], available - logical[identity]);
    }
    bands.push(band);
  }
  // Measure every selected cell before drawing. Tiled bands share row/header heights.
  const layouts = bands.map((band) => {
    const widths = band.map((i) =>
      spec.scaling === 'fit-width'
        ? logical[i] * (available / total)
        : Math.min(
            logical[i],
            available - logical[columns.findIndex((c) => c.field === 'number')],
          ),
    );
    const heading = band.map((i, ci) =>
      wrapCell(printFields[columns[i].field], widths[ci] - 2 * pad, font, size),
    );
    const cells = rows.map((_, ri) => {
      return band.map((i, ci) => {
        if (spec.text !== 'single-line' || columns[i].field === 'number')
          return wrapCell(values[ri][i], widths[ci] - 2 * pad, font, size);
        const value = values[ri][i].replace(/\s+/g, ' '),
          limit = widths[ci] - 2 * pad;
        if (font.widthOfTextAtSize(value, size) <= limit) return [value];
        const chars = Array.from(value);
        let low = 0,
          high = chars.length;
        while (low < high) {
          const mid = Math.ceil((low + high) / 2);
          if (
            font.widthOfTextAtSize(chars.slice(0, mid).join('') + '…', size) <=
            limit
          )
            low = mid;
          else high = mid - 1;
        }
        return [chars.slice(0, low).join('') + '…'];
      });
    });
    return { band, widths, heading, cells };
  });
  const rowLines = rows.map((_, ri) =>
    Math.max(
      ...layouts.flatMap((layout) =>
        layout.cells[ri].map((cell) => cell.length),
      ),
    ),
  );
  const headerLines = Math.max(
    ...layouts.flatMap((layout) => layout.heading.map((cell) => cell.length)),
  );
  const titleLines = wrapCell(
    String(data.meta.name || 'Shot List'),
    available,
    font,
    7,
  );
  const headerHeight =
    19 +
    titleLines.length * 9 +
    11 +
    (spec.text === 'single-line' ? 11 : 0) +
    (bands.length > 1 ? 11 : 0) +
    headerLines * leading +
    2 * pad;
  const pageCapacity = pageH - 2 * margin - headerHeight - 12;
  if (pageCapacity < leading + 2 * pad)
    throw Error(
      'The selected headings leave no printable rows. Choose larger paper or fewer columns.',
    );
  const pages: PDFPage[] = [];
  for (const [bi, layout] of layouts.entries()) {
    const { band, widths, heading } = layout;
    let page!: PDFPage,
      y = 0;
    const drawRow = (
      cells: string[][],
      offset: number,
      count: number,
      height: number,
      heading = false,
    ) => {
      let x = margin;
      band.forEach((_, ci) => {
        page.drawRectangle({
          x,
          y: y - height,
          width: widths[ci],
          height,
          borderWidth: 0.25,
          borderColor: rgb(0.7, 0.73, 0.76),
          color: heading ? rgb(0.88, 0.89, 0.9) : rgb(1, 1, 1),
        });
        cells[ci].slice(offset, offset + count).forEach((line, li) =>
          page.drawText(line, {
            x: x + pad,
            y: y - pad - size - li * leading,
            size,
            font,
            color: rgb(0.05, 0.07, 0.09),
          }),
        );
        x += widths[ci];
      });
      y -= height;
    };
    const start = () => {
      page = pdf.addPage([pageW, pageH]);
      pages.push(page);
      y = pageH - margin;
      page.drawText('WHITEOUT / PRODUCTION DESK', {
        x: margin,
        y: y - 7,
        size: 7,
        font,
      });
      y -= 19;
      titleLines.forEach((line) => {
        page.drawText(line, { x: margin, y: y - 7, size: 7, font });
        y -= 9;
      });
      page.drawText(
        `${spec.scope === 'day' ? 'Shooting Order' : { entire: 'Entire Shot List', current: 'Current View', selected: 'Selected Shots', area: 'Selected Area', scenes: 'Selected Scenes' }[spec.scope]} · ${rows.length} ${rows.length === 1 ? 'row' : 'rows'}`,
        { x: margin, y: y - 6, size: 6, font },
      );
      y -= 11;
      if (spec.text === 'single-line') {
        page.drawText(
          'One-line preview: text shortened; shot identity retained.',
          { x: margin, y: y - 6, size: 6, font },
        );
        y -= 11;
      }
      if (bands.length > 1) {
        page.drawText(`Column band ${bi + 1} of ${bands.length}`, {
          x: margin,
          y: y - 7,
          size: 6,
          font,
        });
        y -= 11;
      }
      drawRow(heading, 0, headerLines, headerLines * leading + 2 * pad, true);
    };
    start();
    let scene = '';
    rows.forEach((row, ri) => {
      const cells = layout.cells[ri];
      const lineCount = rowLines[ri],
        height = Math.max(leading + pad * 2, lineCount * leading + pad * 2);
      const newScene = spec.groupScenes && scene !== String(row.scene.id);
      const caption = newScene
        ? wrapCell(
            `Scene ${row.scene.number || ''}${row.scene.title ? ' · ' + String(row.scene.title) : ''}`,
            available,
            font,
            size,
          )
        : [];
      const captionHeight = caption.length * (leading + 7);
      const capacity = Math.max(
        leading + 2 * pad,
        pageCapacity - captionHeight,
      );
      if (newScene) {
        scene = String(row.scene.id);
        if (y - margin < Math.min(height, capacity) + captionHeight + 12)
          start();
        for (const line of caption) {
          if (y - margin < leading + 8) start();
          page.drawText(line, { x: margin + pad, y: y - size - 4, size, font });
          y -= leading + 7;
        }
      }

      if (height <= capacity) {
        if (y - height < margin + 12) start();
        drawRow(cells, 0, lineCount, height);
      } else {
        // Exceptional tall rows continue in explicit slices, never clip or discard text.
        let offset = 0;
        while (offset < lineCount) {
          let count = Math.floor((y - margin - 12 - pad * 2) / leading);
          if (count < 1) {
            start();
            continue;
          }
          count = Math.min(count, lineCount - offset);
          const slice = cells.map((c) => c.slice(offset, offset + count));
          const id = band.findIndex((i) => columns[i].field === 'number');
          if (offset && id >= 0 && !slice[id].length)
            slice[id] = wrapCell(
              printValue(row, 'number').length > 48
                ? `Row ${ri + 1} (cont.)`
                : printValue(row, 'number') + ' (cont.)',
              widths[id] - 2 * pad,
              font,
              size,
            ).slice(0, count);
          drawRow(slice, 0, count, count * leading + pad * 2);
          offset += count;
          if (offset < lineCount) start();
        }
      }
    });
    if (columns.some((c) => c.field === 'estimatedMinutes')) {
      const estimates = rows.map((row) =>
        printValue(row, 'estimatedMinutes').trim(),
      );
      if (
        estimates.some(Boolean) &&
        estimates.every((v) => !v || /^\d+(?:\.\d+)?\.?$/.test(v))
      ) {
        if (y - margin < 12) start();
        page.drawText(
          `Total estimated time: ${estimates.reduce((sum, v) => sum + (parseFloat(v) || 0), 0)} min`,
          { x: margin, y: y - 9, size: 6, font },
        );
      }
    }
  }
  if (!pages.length) pdf.addPage([pageW, pageH]);
  pages.forEach((page, i) =>
    page.drawText(`${i + 1} / ${pages.length}`, {
      x: pageW - margin - 32,
      y: 15,
      size: 6,
      font,
    }),
  );
  return Buffer.from(await pdf.save());
}

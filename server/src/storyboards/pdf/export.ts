import { getStroke } from 'perfect-freehand';
import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import type SharpFactory from 'sharp';
const sharp: typeof SharpFactory = require('sharp');
import { BadRequestException } from '@nestjs/common';
import { unicodeFontkit } from '../../shotlists/pdf/unicode-font';
export type BoardPrint = {
  panels?: string[];
  layout?: number;
  paper?: string;
  orientation?: string;
  notes?: boolean;
  shots?: boolean;
  annotations?: boolean;
};
function lines(text: string, font: PDFFont, width: number, size: number) {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const char of paragraph) {
      if (line && font.widthOfTextAtSize(line + char, size) > width) {
        out.push(line);
        line = '';
      }
      line += char;
    }
    out.push(line);
  }
  return out;
}
export async function renderStoryboard(
  title: string,
  panels: any[],
  options: BoardPrint,
  artwork: (id: string) => Promise<Buffer>,
  annotations: any[],
  shotLabels: (links: any[]) => Promise<string>,
) {
  const count = options.layout === undefined ? 4 : options.layout;
  if (![1, 2, 4, 6].includes(count))
    throw new BadRequestException('Choose 1, 2, 4 or 6 panels per page.');
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(unicodeFontkit);
  const font = await pdf.embedFont(
    readFileSync(join(__dirname, '../../../assets/fonts/DejaVuSans.ttf')),
    { subset: true },
  );
  const supported = new Set(font.getCharacterSet());
  function validate(s: string) {
    for (const char of s)
      if (char !== '\n' && !supported.has(char.codePointAt(0)!))
        throw new BadRequestException(
          `The export font does not support “${char}”.`,
        );
    return s;
  }
  const base = options.paper === 'a4' ? [595.28, 841.89] : [612, 792],
    landscape = options.orientation !== 'portrait',
    width = landscape ? base[1] : base[0],
    height = landscape ? base[0] : base[1],
    margin = 28,
    gap = 18,
    cols = count === 1 ? 1 : 2,
    rows = Math.ceil(count / cols),
    cellWidth = (width - margin * 2 - gap * (cols - 1)) / cols,
    cellHeight = (height - margin * 2 - 42 - gap * (rows - 1)) / rows;
  let page: any;
  for (let index = 0; index < panels.length; index++) {
    if (index % count === 0) {
      page = pdf.addPage([width, height]);
      page.drawText(validate(title), {
        x: margin,
        y: height - margin - 10,
        size: 11,
        font,
        color: rgb(0.1, 0.16, 0.2),
      });
      page.drawText(
        `WHITEOUT · ${Math.floor(index / count) + 1} / ${Math.ceil(panels.length / count)}`,
        { x: margin, y: 16, size: 8, font, color: rgb(0.4, 0.45, 0.5) },
      );
    }
    const panel = panels[index],
      slot = index % count,
      x = margin + (slot % cols) * (cellWidth + gap),
      top = height - margin - 32 - Math.floor(slot / cols) * (cellHeight + gap),
      label = validate(panel.label || `Panel ${index + 1}`),
      notes = options.notes ? validate(String(panel.notes || '')) : '',
      links = options.shots
        ? validate(await shotLabels(panel.links || []))
        : '';
    const detail = lines(
        [links, notes].filter(Boolean).join('\n'),
        font,
        cellWidth,
        8,
      ),
      reserved = 20 + detail.length * 10;
    if (reserved > cellHeight * 0.5)
      throw new BadRequestException(
        'The selected notes are too long for this layout. Choose fewer panels per page or hide notes.',
      );
    page.drawText(label, { x, y: top - 10, font, size: 10 });
    const areaHeight = cellHeight - reserved - 10;
    if (panel.assetId) {
      const original = await artwork(panel.assetId),
        png = await sharp(original, { limitInputPixels: 80_000_000 })
          .rotate()
          .png()
          .toBuffer(),
        image = await pdf.embedPng(png),
        scale = Math.min(cellWidth / image.width, areaHeight / image.height),
        w = image.width * scale,
        h = image.height * scale,
        ix = x + (cellWidth - w) / 2,
        iy = top - 20 - h;
      page.drawImage(image, { x: ix, y: iy, width: w, height: h });
      if (options.annotations)
        for (const a of annotations.filter(
          (a) => a.revisionId === panel.activeRevision,
        )) {
          if (
            !/^#[0-9a-f]{6}$/i.test(a.color) ||
            !Number.isFinite(a.width) ||
            !Number.isFinite(a.scale)
          )
            throw new BadRequestException(
              'An annotation has invalid geometry.',
            );
          const color = rgb(
              parseInt(a.color.slice(1, 3), 16) / 255,
              parseInt(a.color.slice(3, 5), 16) / 255,
              parseInt(a.color.slice(5, 7), 16) / 255,
            ),
            point = (p: number[]) => ({
              x: ix + (a.x + p[0] * a.scale) * w,
              y: iy + h - (a.y + p[1] * a.scale) * h,
            }),
            thickness = Math.max(0.2, a.width * w * a.scale);
          if (a.type === 'text') {
            const p = point([0, 0]);
            page.drawText(validate(a.text || ''), {
              ...p,
              y: p.y - ((Math.max(18, a.width * 5000) * w) / 1000) * a.scale,
              size: ((Math.max(18, a.width * 5000) * w) / 1000) * a.scale,
              font,
              color,
            });
          } else {
            const worldHeight = (1000 * image.height) / image.width,
              points = (a.points || []).map((p: number[]) => [
                p[0] * 1000,
                p[1] * worldHeight,
                p[2] ?? 0.5,
              ]),
              size = a.width * 1000;
            let path = '';
            if (a.type === 'pen' || a.type === 'highlight') {
              const polygon = getStroke(points, {
                size,
                thinning: a.type === 'highlight' ? 0 : 0.45,
                smoothing: 0.65,
                streamline: 0.6,
                simulatePressure: points.every((p: number[]) => p[2] === 0.5),
                last: true,
              });
              if (polygon.length > 2)
                path = 'M' + polygon.map((p) => p.join(',')).join(' L') + ' Z';
              if (path)
                page.drawSvgPath(path, {
                  x: ix + a.x * w,
                  y: iy + h - a.y * h,
                  scale: (w / 1000) * a.scale,
                  color,
                  opacity: a.type === 'highlight' ? 0.32 : 1,
                });
            } else if (a.type === 'arrow' && points.length === 3) {
              // Konva's MIT-licensed tension geometry, t=.5, for the same three-point arrow.
              const [p0, p1, p2] = points,
                d01 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]),
                d12 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]),
                sum = d01 + d12 || 1,
                fa = (0.5 * d01) / sum,
                fb = (0.5 * d12) / sum,
                cp1 = [
                  p1[0] - fa * (p2[0] - p0[0]),
                  p1[1] - fa * (p2[1] - p0[1]),
                ],
                cp2 = [
                  p1[0] + fb * (p2[0] - p0[0]),
                  p1[1] + fb * (p2[1] - p0[1]),
                ];
              path = `M${p0[0]},${p0[1]} Q${cp1[0]},${cp1[1]} ${p1[0]},${p1[1]} Q${cp2[0]},${cp2[1]} ${p2[0]},${p2[1]}`;
              const angle = Math.atan2(p2[1] - cp2[1], p2[0] - cp2[0]),
                length = Math.max(10, size * 3),
                headWidth = Math.max(8, size * 2.5),
                back = [
                  p2[0] - length * Math.cos(angle),
                  p2[1] - length * Math.sin(angle),
                ];
              page.drawSvgPath(path, {
                x: ix + a.x * w,
                y: iy + h - a.y * h,
                scale: (w / 1000) * a.scale,
                borderColor: color,
                borderWidth: size,
              });
              page.drawSvgPath(
                `M${p2[0]},${p2[1]} L${back[0] + (headWidth / 2) * Math.sin(angle)},${back[1] - (headWidth / 2) * Math.cos(angle)} L${back[0] - (headWidth / 2) * Math.sin(angle)},${back[1] + (headWidth / 2) * Math.cos(angle)} Z`,
                {
                  x: ix + a.x * w,
                  y: iy + h - a.y * h,
                  scale: (w / 1000) * a.scale,
                  color,
                },
              );
            }
          }
        }
    }
    detail.forEach((text, i) =>
      page.drawText(text, {
        x,
        y: top - cellHeight + reserved - 20 - i * 10,
        font,
        size: 8,
      }),
    );
  }
  if (!panels.length)
    throw new BadRequestException('No panels are selected for export.');
  return Buffer.from(await pdf.save());
}

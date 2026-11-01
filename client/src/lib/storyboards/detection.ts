import type { Rect } from './model'
/** Conservative raster line segments. Suggestions only: never OCR or shot matching.
 * Work at <=1200px and require four supporting edges. Interior drawings are not
 * accepted as frames merely because their connected-component box is rectangular. */
export function suggestRegions(image: ImageData): Rect[] {
  const { width: w, height: h, data } = image
  const dark = (x: number, y: number) => {
    const i = (y * w + x) * 4
    return data[i + 3] > 100 && data[i] + data[i + 1] + data[i + 2] < 250
  }
  const lines: { x: number; y: number; end: number }[] = []
  for (let y = 0; y < h; y++) {
    let start = -1,
      last = -1
    for (let x = 0; x <= w; x++) {
      if (x < w && dark(x, y)) {
        if (start < 0) start = x
        last = x
      }
      if (start >= 0 && (x - last > 3 || x === w)) {
        if (last - start > w * 0.12) lines.push({ x: start, y, end: last })
        start = -1
      }
    }
  }
  const result: Rect[] = []
  for (const top of lines)
    for (const bottom of lines) {
      const height = bottom.y - top.y,
        width = top.end - top.x
      if (
        height < h * 0.09 ||
        height > h * 0.8 ||
        Math.abs(top.x - bottom.x) > 6 ||
        Math.abs(top.end - bottom.end) > 6
      )
        continue
      let left = 0,
        right = 0
      for (let y = top.y; y <= bottom.y; y++) {
        if ([-2, -1, 0, 1, 2].some((d) => top.x + d >= 0 && dark(top.x + d, y)))
          left++
        if (
          [-2, -1, 0, 1, 2].some((d) => top.end + d < w && dark(top.end + d, y))
        )
          right++
      }
      if (left / height < 0.93 || right / height < 0.93) continue
      const r = {
        x: top.x / w,
        y: top.y / h,
        width: width / w,
        height: height / h,
      }
      if (
        result.some(
          (a) =>
            Math.abs(a.x - r.x) < 0.015 &&
            Math.abs(a.y - r.y) < 0.015 &&
            Math.abs(a.width - r.width) < 0.015 &&
            Math.abs(a.height - r.height) < 0.015,
        )
      )
        continue
      result.push(r)
    }
  const accepted: Rect[] = []
  for (const r of result.sort(
    (a, b) => a.width * a.height - b.width * b.height,
  )) {
    if (
      accepted.some((a) => {
        const overlap =
          Math.max(
            0,
            Math.min(a.x + a.width, r.x + r.width) - Math.max(a.x, r.x),
          ) *
          Math.max(
            0,
            Math.min(a.y + a.height, r.y + r.height) - Math.max(a.y, r.y),
          )
        return overlap / Math.min(a.width * a.height, r.width * r.height) > 0.85
      })
    )
      continue
    accepted.push(r)
  }
  return readingOrder(accepted).slice(0, 80)
}
/** Cluster rows using overlap, then sort within each row. A comparator based only
 * on near-equal top edges is non-transitive and misorders irregular frames. */
export function readingOrder<T extends Rect>(regions: T[]): T[] {
  const rows: { top: number; bottom: number; items: T[] }[] = []
  for (const region of [...regions].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find(
      (row) =>
        Math.max(
          0,
          Math.min(row.bottom, region.y + region.height) -
            Math.max(row.top, region.y),
        ) /
          Math.min(row.bottom - row.top, region.height) >
        0.45,
    )
    if (row) {
      row.items.push(region)
      row.top = Math.max(row.top, region.y)
      row.bottom = Math.min(row.bottom, region.y + region.height)
    } else
      rows.push({
        top: region.y,
        bottom: region.y + region.height,
        items: [region],
      })
  }
  return rows
    .sort((a, b) => a.top - b.top)
    .flatMap((row) => row.items.sort((a, b) => a.x - b.x || a.y - b.y))
}

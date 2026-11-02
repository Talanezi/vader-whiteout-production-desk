/** Geometry in artwork units. Erasing trims editable samples, never source pixels. */
export type Point = number[]
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1]
const sub = (a: Point, b: Point) => [a[0] - b[0], a[1] - b[1]]
const mix = (a: Point, b: Point, t: number) =>
  a.map((v, i) => v + ((b[i] ?? v) - v) * t)
export function pointSegment(p: Point, a: Point, b: Point) {
  const d = sub(b, a),
    t = Math.max(0, Math.min(1, dot(sub(p, a), d) / (dot(d, d) || 1)))
  return Math.hypot(...sub(p, mix(a, b, t)))
}
function diskInterval(a: Point, b: Point, c: Point, r: number): number[][] {
  const d = sub(b, a),
    f = sub(a, c),
    aa = dot(d, d),
    bb = 2 * dot(f, d),
    cc = dot(f, f) - r * r
  if (!aa) return cc <= 0 ? [[0, 1]] : []
  const disc = bb * bb - 4 * aa * cc
  if (disc < 0) return []
  const lo = Math.max(0, (-bb - Math.sqrt(disc)) / (2 * aa)),
    hi = Math.min(1, (-bb + Math.sqrt(disc)) / (2 * aa))
  return hi > lo ? [[lo, hi]] : []
}
/** Exact intervals of a line segment covered by a swept circular eraser (capsule). */
export function capsuleIntervals(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
  r: number,
) {
  const intervals = [...diskInterval(a, b, c, r), ...diskInterval(a, b, d, r)]
  const v = sub(d, c),
    length = Math.hypot(...v)
  if (!length) return intervals
  const u = v.map((x) => x / length),
    n = [-u[1], u[0]],
    p = sub(a, c),
    delta = sub(b, a)
  let lo = 0,
    hi = 1
  for (const [axis, min, max] of [
    [u, 0, length],
    [n, -r, r],
  ] as [Point, number, number][]) {
    const origin = dot(p, axis),
      slope = dot(delta, axis)
    if (Math.abs(slope) < 1e-10) {
      if (origin < min || origin > max) return intervals
    } else {
      const t1 = (min - origin) / slope,
        t2 = (max - origin) / slope
      lo = Math.max(lo, Math.min(t1, t2))
      hi = Math.min(hi, Math.max(t1, t2))
    }
  }
  if (hi > lo) intervals.push([lo, hi])
  return intervals
}
export function strokeIntersects(
  points: Point[],
  sweep: Point[],
  radius: number,
) {
  if (!points.length || !sweep.length) return false
  if (points.length === 1)
    return sweep.some(
      (p, i) => pointSegment(points[0], sweep[Math.max(0, i - 1)], p) <= radius,
    )
  for (let i = 1; i < points.length; i++)
    for (let j = 0; j < sweep.length; j++) {
      if (
        capsuleIntervals(
          points[i - 1],
          points[i],
          sweep[Math.max(0, j - 1)],
          sweep[j],
          radius,
        ).length
      )
        return true
    }
  return false
}
/** Subtract a union of swept capsules, interpolating pressure at new endpoints. */
export function trimStroke(
  points: Point[],
  sweep: Point[],
  radius: number,
): Point[][] {
  const result: Point[][] = []
  let part: Point[] = []
  const flush = () => {
    if (part.length >= 2) result.push(part)
    part = []
  }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      cuts: number[][] = []
    for (let j = 0; j < sweep.length; j++)
      cuts.push(
        ...capsuleIntervals(a, b, sweep[Math.max(0, j - 1)], sweep[j], radius),
      )
    cuts.sort((a, b) => a[0] - b[0])
    const merged: number[][] = []
    for (const cut of cuts) {
      const last = merged[merged.length - 1]
      if (last && cut[0] <= last[1] + 1e-8) last[1] = Math.max(last[1], cut[1])
      else merged.push([...cut])
    }
    let start = 0
    for (const [lo, hi] of [...merged, [1, 1]]) {
      if (lo > start + 1e-8) {
        const p = mix(a, b, start)
        if (!part.length) part.push(p)
        part.push(mix(a, b, lo))
      }
      if (hi > lo) flush()
      start = hi
    }
  }
  flush()
  return result
}
function simplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points
  let max = 0,
    index = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointSegment(points[i], points[0], points[points.length - 1])
    if (d > max) {
      max = d
      index = i
    }
  }
  return max > epsilon
    ? [
        ...simplify(points.slice(0, index + 1), epsilon).slice(0, -1),
        ...simplify(points.slice(index), epsilon),
      ]
    : [points[0], points[points.length - 1]]
}
export type Recognition = {
  type: 'line' | 'rectangle' | 'ellipse' | 'path' | 'arrow'
  points: Point[]
  name: string
}
/** Conservative geometric recognition; only invoked by a deliberate stationary hold. */
export function recognizeShape(points: Point[]): Recognition | undefined {
  if (points.length < 5) return
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]),
    min = [Math.min(...xs), Math.min(...ys)],
    max = [Math.max(...xs), Math.max(...ys)]
  const w = max[0] - min[0],
    h = max[1] - min[1],
    diagonal = Math.hypot(w, h)
  if (diagonal < 18) return
  const start = points[0],
    end = points[points.length - 1],
    distance = Math.hypot(...sub(end, start)),
    length = points
      .slice(1)
      .reduce((n, p, i) => n + Math.hypot(...sub(p, points[i])), 0)
  const deviation = Math.sqrt(
    points.reduce((n, p) => n + pointSegment(p, start, end) ** 2, 0) /
      points.length,
  )
  if (
    distance > diagonal * 0.85 &&
    length < distance * 1.18 &&
    deviation < diagonal * 0.035
  )
    return { type: 'line', points: [start, end], name: 'Line' }
  if (distance < diagonal * 0.16 && w > 15 && h > 15) {
    const radial = points.map((p) =>
      Math.hypot(
        (p[0] - (min[0] + max[0]) / 2) / (w / 2),
        (p[1] - (min[1] + max[1]) / 2) / (h / 2),
      ),
    )
    if (
      radial.reduce((n, r) => n + (r - 1) ** 2, 0) / radial.length < 0.009 &&
      length < Math.PI * (w + h) * 0.7
    )
      return {
        type: 'ellipse',
        points: [min, max],
        name: Math.abs(w / h - 1) < 0.12 ? 'Circle' : 'Ellipse',
      }
    const edgeError =
      points.reduce(
        (n, p) =>
          n +
          Math.min(
            Math.abs(p[0] - min[0]),
            Math.abs(p[0] - max[0]),
            Math.abs(p[1] - min[1]),
            Math.abs(p[1] - max[1]),
          ) **
            2,
        0,
      ) / points.length
    if (
      Math.sqrt(edgeError) < Math.min(w, h) * 0.065 &&
      length < (w + h) * 2.4 &&
      length > (w + h) * 1.65
    )
      return {
        type: 'rectangle',
        points: [min, max],
        name: Math.abs(w / h - 1) < 0.12 ? 'Square' : 'Rectangle',
      }
    const corners = simplify(points, diagonal * 0.055)
    if (
      corners.length === 4 &&
      Math.hypot(...sub(corners[0], corners[3])) < diagonal * 0.16
    ) {
      const anchors = [...corners.slice(0, 3), corners[0]],
        bezier = [anchors[0]]
      for (let i = 1; i < anchors.length; i++)
        bezier.push(
          mix(anchors[i - 1], anchors[i], 1 / 3),
          mix(anchors[i - 1], anchors[i], 2 / 3),
          anchors[i],
        )
      return { type: 'path', points: bezier, name: 'Triangle' }
    }
  }
  const vertices = simplify(points, diagonal * 0.035)
  if (vertices.length >= 4 && vertices.length <= 5) {
    const tip = vertices[1],
      shaft = Math.hypot(...sub(tip, vertices[0])),
      tail = vertices.slice(2)
    if (
      shaft > diagonal * 0.65 &&
      tail.every((p) => Math.hypot(...sub(p, tip)) < shaft * 0.45) &&
      tail.some((p) => Math.hypot(...sub(p, tip)) > shaft * 0.1)
    )
      return {
        type: 'arrow',
        points: [vertices[0], mix(vertices[0], tip, 0.5), tip],
        name: 'Arrow',
      }
  }
}

export type ArtworkFrame = { height: number; fit: 'contain' | 'crop' }
/** A non-destructive viewport over the original composition's coordinate space. */
export function artworkFrame(height: number, frame?: ArtworkFrame | null) {
  const h = frame?.height || height,
    scale =
      frame?.fit === 'crop' ? Math.max(1, h / height) : Math.min(1, h / height)
  return {
    x: -(1000 - 1000 * scale) / 2 / scale,
    y: -(h - height * scale) / 2 / scale,
    width: 1000 / scale,
    height: h / scale,
  }
}

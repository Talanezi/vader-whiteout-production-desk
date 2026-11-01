import { Button } from '../whiteout/Button'
import type { CropRegion } from './CropEditor'
export type ExtractionEntry = {
  page: number
  crop: CropRegion
  preview: { url: string; width: number; height: number }
}
export default function ExtractionReview({
  entries,
  onReorder,
}: {
  entries: ExtractionEntry[]
  onReorder: (ids: string[]) => void
}) {
  function move(index: number, delta: number) {
    const ids = entries.map((e) => e.crop.id)
    ;[ids[index], ids[index + delta]] = [ids[index + delta], ids[index]]
    onReorder(ids)
  }
  return (
    <div className="sb-extraction-review">
      <p>
        {entries.length} panels · {new Set(entries.map((e) => e.page)).size}{' '}
        source pages
      </p>
      <ol>
        {entries.map(({ page, crop: r, preview: p }, i) => (
          <li key={r.id}>
            <svg
              viewBox={`${r.x * p.width} ${r.y * p.height} ${r.width * p.width} ${r.height * p.height}`}
              role="img"
              aria-label={r.label || `Reviewed panel ${i + 1}`}
            >
              <image href={p.url} width={p.width} height={p.height} />
            </svg>
            <div>
              <strong>{r.label || `Panel ${i + 1}`}</strong>
              <small>Source page {page + 1}</small>
            </div>
            <div className="sb-review-order">
              <Button icon="up" disabled={i === 0} onClick={() => move(i, -1)}>
                Earlier
              </Button>
              <Button
                icon="down"
                disabled={i === entries.length - 1}
                onClick={() => move(i, 1)}
              >
                Later
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

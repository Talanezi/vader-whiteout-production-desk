import './storyboards.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { boardRequest } from '../../lib/storyboards/api'
import Artwork from './Artwork'
type Entry = {
  boardId: string
  name: string
  panelId: string
  label: string
  assetId?: string
  drawingHeight?: number
  frame?: import('../../lib/storyboards/framing').ArtworkFrame
  drawing?: import('../../lib/storyboards/model').Annotation[]
}
export default function ShotStoryboards({
  listId,
  shotId,
}: {
  listId: string
  shotId: string
}) {
  const [items, setItems] = useState<Entry[]>([])
  useEffect(() => {
    let alive = true
    setItems([])
    boardRequest<{ items: Entry[] }>(
      `/shotlinks?listId=${encodeURIComponent(listId)}&shotId=${encodeURIComponent(shotId)}`,
    )
      .then((r) => alive && setItems(r.items))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [listId, shotId])
  if (!items.length) return null
  return (
    <section className="sb-shot-thumbnails">
      <h3>Storyboards</h3>
      <div>
        {items.map((item) => (
          <Link
            key={item.boardId + item.panelId}
            to={`/storyboards/${item.boardId}?panel=${item.panelId}`}
            title={`${item.name} · ${item.label || 'Panel'}`}
          >
            <Artwork
              documentId={item.boardId}
              assetId={item.assetId}
              drawing={item.drawing}
              drawingHeight={item.drawingHeight}
              frame={item.frame}
              label={item.label || item.name}
            />
            <span>{item.label || item.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

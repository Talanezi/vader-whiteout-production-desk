import * as Y from 'yjs'
export type Rect = { x: number; y: number; width: number; height: number }
export type Source = {
  assetId: string
  page: number
  rotation: number
  crop: Rect
}
export type ShotLink = { listId: string; shotId: string }
export type Annotation = {
  id: string
  type: 'pen' | 'arrow' | 'highlight' | 'text' | 'path' | 'rectangle' | 'ellipse' | 'line' | 'callout'
  color: string
  width: number
  points: number[][]
  x: number
  y: number
  scale: number
  text?: string
  engine?: string
  path?: string
  filled?: boolean
  opacity?: number
  rotation?: number
  bounds?: number[]
  fontSize?: number
}
export type ArtworkRevision = {
  id: string
  assetId?: string
  kind?: 'native'
  width?: number
  height?: number
  source?: Source
  uploaderName?: string
  uploader: number
  createdAt: string
}
export type Panel = {
  id: string
  label: string
  notes: string
  order: number
  activeRevision?: string
  deletedAt?: string
  links: ShotLink[]
}
export function values<T>(doc: Y.Doc, name: string): T[] {
  return [...doc.getMap<Y.Map<unknown>>(name).values()].map(
    (x) => x.toJSON() as T,
  )
}
export function put(
  doc: Y.Doc,
  collection: string,
  id: string,
  value: Record<string, unknown>,
) {
  doc.transact(() => {
    const root = doc.getMap<Y.Map<unknown>>(collection)
    let map = root.get(id)
    if (!map) {
      map = new Y.Map()
      root.set(id, map)
    }
    Object.entries(value).forEach(([k, v]) => {
      if (collection === 'panels' && k === 'notes' && typeof v === 'string') {
        const text = map!.get(k)
        if (text instanceof Y.Text) {
          if (text.toString() !== v) {
            text.delete(0, text.length)
            text.insert(0, v)
          }
        } else {
          const next = new Y.Text()
          map!.set(k, next)
          next.insert(0, v)
        }
      } else map!.set(k, v)
    })
  })
}
export function panels(doc: Y.Doc) {
  return values<Panel>(doc, 'panels')
    .filter((p) => !p.deletedAt)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}
export function validRect(r: Rect) {
  return (
    Object.values(r).every(Number.isFinite) &&
    r.x >= 0 &&
    r.y >= 0 &&
    r.width > 0 &&
    r.height > 0 &&
    r.x + r.width <= 1.000001 &&
    r.y + r.height <= 1.000001
  )
}
export function clampRect(r: Rect): Rect {
  const x = Math.max(0, Math.min(0.999, r.x)),
    y = Math.max(0, Math.min(0.999, r.y))
  return {
    x,
    y,
    width: Math.max(0.001, Math.min(1 - x, r.width)),
    height: Math.max(0.001, Math.min(1 - y, r.height)),
  }
}

export function panelNotes(doc: Y.Doc, id: string): Y.Text {
  const panel = doc.getMap<Y.Map<unknown>>('panels').get(id)!
  const existing = panel.get('notes')
  if (existing instanceof Y.Text) return existing
  const text = new Y.Text()
  doc.transact(() => {
    panel.set('notes', text)
    text.insert(0, String(existing || ''))
  }, 'notes-compatibility')
  return text
}

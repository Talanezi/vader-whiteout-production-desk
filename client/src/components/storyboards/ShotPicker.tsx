import { useEffect, useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import { SearchField } from '../whiteout/Workspace'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import Menu from '../whiteout/Menu'
import { shotRequest, type ShotListMetadata } from '../../lib/shotApi'
import type { ShotLink } from '../../lib/storyboards/model'
export type LinkedSnapshot = {
  meta: Record<string, unknown>
  shots: Record<string, Record<string, unknown>>
  scenes: Record<string, Record<string, unknown>>
}
export default function ShotPicker({
  initial = [],
  onConfirm,
  onClose,
}: {
  initial?: ShotLink[]
  onConfirm: (links: ShotLink[]) => void
  onClose: () => void
}) {
  const [lists, setLists] = useState<ShotListMetadata[]>([]),
    [listId, setListId] = useState(initial[0]?.listId || ''),
    [data, setData] = useState<LinkedSnapshot>(),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState(initial),
    [error, setError] = useState(''),
    [scene, setScene] = useState('')
  useEffect(() => {
    shotRequest<{ items: ShotListMetadata[] }>('')
      .then((r) => {
        setLists(r.items)
        if (!listId) setListId(r.items[0]?.id || '')
      })
      .catch((e) => setError(e.message))
  }, [])
  useEffect(() => {
    if (!listId) return
    let alive = true
    setData(undefined)
    shotRequest<LinkedSnapshot>(`/${listId}/export`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [listId])
  const shots = Object.entries(data?.shots || {})
    .filter(
      ([, s]) =>
        !s.deletedAt &&
        (!scene || s.sceneId === scene) &&
        [s.number, s.coverage, data?.scenes[String(s.sceneId)]?.number]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(data?.scenes[String(a[1].sceneId)]?.order || 0) -
          Number(data?.scenes[String(b[1].sceneId)]?.order || 0) ||
        Number(a[1].order) - Number(b[1].order) ||
        a[0].localeCompare(b[0]),
    )
  const checked = (id: string) =>
    selected.some((x) => x.listId === listId && x.shotId === id)
  const toggle = (id: string, on: boolean) =>
    setSelected((old) =>
      on
        ? [
            ...old.filter((x) => x.listId !== listId || x.shotId !== id),
            { listId, shotId: id },
          ]
        : old.filter((x) => x.listId !== listId || x.shotId !== id),
    )
  return (
    <Overlay
      title="Link shots"
      onClose={onClose}
      className="sb-shot-picker"
      footer={
        <>
          <span>{selected.length} selected</span>
          <Button disabled={!selected.length} onClick={() => setSelected([])}>
            Clear selection
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onConfirm(selected)}>
            Use selected shots
          </Button>
        </>
      }
    >
      {error && <p role="alert">{error}</p>}
      <div className="sb-toolstrip">
        <Menu
          label={lists.find((l) => l.id === listId)?.name || 'Choose Shot List'}
          items={lists.map((l) => ({ value: l.id, label: l.name }))}
          value={listId}
          onChange={(id) => {
            setListId(id)
            setScene('')
          }}
        />
        <Menu
          label={scene ? `Scene ${data?.scenes[scene]?.number}` : 'All scenes'}
          value={scene}
          onChange={setScene}
          items={[
            { value: '', label: 'All scenes' },
            ...Object.entries(data?.scenes || {})
              .filter(([, s]) => !s.deletedAt)
              .map(([id, s]) => ({ value: id, label: `Scene ${s.number}` })),
          ]}
        />
      </div>
      <SearchField
        label="Search shots"
        placeholder="Shot, scene or coverage…"
        value={search}
        onChange={setSearch}
      />
      <div className="sb-shot-options">
        <label>
          <DrawCheckbox
            aria-label="Select shown shots"
            checked={!!shots.length && shots.every(([id]) => checked(id))}
            indeterminate={
              shots.some(([id]) => checked(id)) &&
              !shots.every(([id]) => checked(id))
            }
            onChange={(e) => {
              const ids = new Set(shots.map(([id]) => id))
              setSelected((old) =>
                e.target.checked
                  ? [
                      ...old.filter(
                        (x) => x.listId !== listId || !ids.has(x.shotId),
                      ),
                      ...shots.map(([id]) => ({ listId, shotId: id })),
                    ]
                  : old.filter(
                      (x) => x.listId !== listId || !ids.has(x.shotId),
                    ),
              )
            }}
          />
          Select shown shots
        </label>
        {shots.map(([id, s]) => (
          <label key={id}>
            <DrawCheckbox
              aria-label={`Select ${s.number}, ${id.slice(0, 8)}`}
              checked={checked(id)}
              onChange={(e) => toggle(id, e.target.checked)}
            />
            <span>
              <strong>{String(s.number || 'Untitled shot')}</strong>
              <small>
                Scene {String(data?.scenes[String(s.sceneId)]?.number || '—')} ·{' '}
                {id.slice(0, 8)}
              </small>
              <span>{String(s.coverage || '')}</span>
            </span>
          </label>
        ))}
      </div>
    </Overlay>
  )
}

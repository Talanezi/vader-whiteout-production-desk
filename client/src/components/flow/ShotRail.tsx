import { useEffect, useState } from 'react'
import { useDraggable } from '@dnd-kit/react'
import type * as Y from 'yjs'
import { Link } from 'react-router-dom'
import { SearchField } from '../whiteout/Workspace'
import Menu from '../whiteout/Menu'
import { Button, IconButton } from '../whiteout/Button'
import {
  ordered,
  shots,
  scenes,
  str,
  displayShot,
} from '../../lib/shotDocument'
import type { FlowEvent } from '../../lib/flow/model'
import { boardRequest } from '../../lib/storyboards/api'
function RailShot({
  shot,
  doc,
  scope,
  count,
  onAdd,
  onSelect,
}: {
  shot: Y.Map<unknown>
  index: number
  doc: Y.Doc
  scope: string
  count: number
  onAdd: (s: Y.Map<unknown>) => void
  onSelect: () => void
}) {
  const s = useDraggable({
    id: 'rail:' + str(shot, 'id'),
    type: scope,
  })
  return (
    <article
      ref={s.ref}
      className="flow-rail-shot"
      data-dragging={s.isDragging || undefined}
    >
      <button
        ref={s.handleRef as never}
        className="flow-grip"
        aria-label={`Schedule ${displayShot(doc, shot)}`}
      >
        ⠿
      </button>
      <button className="flow-rail-select" onClick={onSelect}>
        <strong>
          {displayShot(doc, shot)}
          <small>
            Scene {str(scenes(doc).get(str(shot, 'sceneId')), 'number')} ·{' '}
            {str(shot, 'id').slice(0, 6)}
          </small>
        </strong>
        <span>{str(shot, 'subject')}</span>
        <p>{str(shot, 'coverage')}</p>
        <small>
          {['camera', 'framing', 'lens']
            .map((k) => str(shot, k))
            .filter(Boolean)
            .join(' · ')}
          {str(shot, 'estimatedMinutes')
            ? ' · ' + str(shot, 'estimatedMinutes') + ' min'
            : ''}
        </small>
        {count > 0 && (
          <small>
            {count} scheduled occurrence{count === 1 ? '' : 's'}
          </small>
        )}
      </button>
      <IconButton
        name="plus"
        label={`Add occurrence of ${displayShot(doc, shot)}`}
        onClick={() => onAdd(shot)}
      />
    </article>
  )
}
export default function ShotRail({
  source,
  listId,
  events,
  scope,
  onAdd,
  onClose,
  onConnect,
  onDisconnect,
  onSelect,
}: {
  source?: Y.Doc
  listId: string
  events: FlowEvent[]
  scope: string
  onAdd: (s: Y.Map<unknown>) => void
  onClose: () => void
  onConnect: () => void
  onDisconnect: () => void
  onSelect: (s: Y.Map<unknown>) => void
}) {
  const [search, setSearch] = useState(''),
    [scene, setScene] = useState(''),
    [selected, setSelected] = useState(''),
    [art, setArt] = useState<
      { boardId: string; name: string; panelId: string }[]
    >([])
  useEffect(() => {
    setArt([])
    if (selected && listId)
      void boardRequest<{ items: typeof art }>(
        `/shotlinks?listId=${encodeURIComponent(listId)}&shotId=${encodeURIComponent(selected)}`,
      )
        .then((r) => setArt(r.items))
        .catch(() => {})
  }, [selected, listId])
  const rows = source
    ? ordered(shots(source))
        .filter(
          (s) =>
            (!scene || str(s, 'sceneId') === scene) &&
            [str(s, 'number'), str(s, 'subject'), str(s, 'coverage')]
              .join(' ')
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort(
          (a, b) =>
            Number(scenes(source).get(str(a, 'sceneId'))?.get('order') || 0) -
              Number(
                scenes(source).get(str(b, 'sceneId'))?.get('order') || 0,
              ) || Number(a.get('order')) - Number(b.get('order')),
        )
    : []
  const count = (id: string) =>
    events.filter((e) => e.sourceListId === listId && e.shotId === id).length
  return (
    <aside className="flow-shot-rail" aria-label="Connected Shot Rail">
      <header>
        <h2>Shot Rail</h2>
        <IconButton name="close" label="Close Shot Rail" onClick={onClose} />
      </header>
      {!listId ? (
        <div className="flow-rail-empty">
          <p>Connect an existing Shot List to schedule its shots.</p>
          <Button icon="shots" onClick={onConnect}>
            Connect Shot List
          </Button>
        </div>
      ) : (
        <>
          <div className="flow-rail-source">
            <Link to={`/shotlists/${listId}`}>
              {String(
                source?.getMap('meta').get('name') || 'Connected Shot List',
              )}
            </Link>
            <Menu
              compact
              label="Shot List connection"
              items={[
                {
                  value: 'open',
                  label: 'Open Shot List',
                  onSelect: () => {
                    window.location.hash = `/shotlists/${listId}`
                  },
                },
                {
                  value: 'disconnect',
                  label: 'Disconnect',
                  onSelect: onDisconnect,
                },
              ]}
            />
          </div>
          <SearchField
            label="Search connected shots"
            placeholder="Shot, subject or coverage…"
            value={search}
            onChange={setSearch}
          />
          <Menu
            label={
              scene && source
                ? str(scenes(source).get(scene), 'number')
                : 'All scenes'
            }
            value={scene}
            onChange={setScene}
            items={[
              { value: '', label: 'All scenes' },
              ...(source
                ? ordered(scenes(source)).map((s) => ({
                    value: str(s, 'id'),
                    label: 'Scene ' + str(s, 'number'),
                  }))
                : []),
            ]}
          />
          <div className="flow-rail-scroll">
            {[false, true].map((scheduled) => (
              <section key={String(scheduled)}>
                <h3>{scheduled ? 'Scheduled' : 'Not scheduled'}</h3>
                {rows
                  .filter((s) => Boolean(count(str(s, 'id'))) === scheduled)
                  .map((s, i) => (
                    <RailShot
                      key={str(s, 'id')}
                      shot={s}
                      index={i}
                      doc={source!}
                      scope={scope}
                      count={count(str(s, 'id'))}
                      onAdd={onAdd}
                      onSelect={() => {
                        setSelected(str(s, 'id'))
                        onSelect(s)
                      }}
                    />
                  ))}
              </section>
            ))}
            {!rows.length && (
              <p className="flow-muted">No available shots match this view.</p>
            )}
            {art.length > 0 && (
              <section>
                <h3>Linked Storyboards</h3>
                {art.map((a) => (
                  <Link
                    className="flow-art-link"
                    key={a.panelId}
                    to={`/storyboards/${a.boardId}?panel=${a.panelId}`}
                  >
                    {a.name} · artwork available
                  </Link>
                ))}
              </section>
            )}
          </div>
        </>
      )}
    </aside>
  )
}

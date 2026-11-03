import { useState } from 'react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable, isSortable } from '@dnd-kit/react/sortable'
import { shotSensors } from '../shots/ShotDrag'
import { IconButton } from '../whiteout/Button'
import { Overlay } from '../whiteout/Overlay'
import type { ShotLink } from '../../lib/storyboards/model'
function Item({
  link,
  index,
  shot,
  onRemove,
  onPreview,
}: {
  link: ShotLink
  index: number
  shot: Record<string, unknown>
  onRemove: () => void
  onPreview: () => void
}) {
  const d = useSortable({
    id: link.shotId,
    index,
    group: 'flow-draft',
    type: 'flow-draft',
    accept: 'flow-draft',
    transition: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? null
      : { duration: 180 },
  })
  return (
    <li ref={d.ref} data-dragging={d.isDragging || undefined}>
      <button
        ref={d.handleRef as never}
        className="flow-grip"
        aria-label={'Move ' + String(shot.number)}
      >
        ⠿
      </button>
      <button className="flow-draft-shot" onClick={onPreview}>
        <strong>
          {String(shot.number || 'Shot')}{' '}
          {shot.subject ? '· ' + shot.subject : ''}
        </strong>
        <small>
          {[
            shot.camera,
            shot.framing,
            shot.lens,
            shot.estimatedMinutes !== '' && shot.estimatedMinutes != null
              ? shot.estimatedMinutes + ' min'
              : 'Estimate needed',
          ]
            .filter(Boolean)
            .join(' · ')}
        </small>
      </button>
      <IconButton
        name="trash"
        label={'Remove ' + String(shot.number)}
        onClick={onRemove}
      />
    </li>
  )
}
export default function SelectedShots({
  links,
  data,
  onChange,
}: {
  links: ShotLink[]
  data: Record<string, Record<string, unknown>>
  onChange: (v: ShotLink[]) => void
}) {
  const [preview, setPreview] = useState<string>()
  return (
    <>
      <div className="flow-draft-summary">
        {links.length} shots selected
      </div>
      <DragDropProvider
        sensors={shotSensors}
        onDragEnd={(e) => {
          const s = e.operation.source
          if (e.canceled || !isSortable(s)) return
          const a = links.findIndex((l) => l.shotId === s.id),
            b = s.index
          if (a < 0 || a === b) return
          const n = [...links],
            v = n.splice(a, 1)[0]
          n.splice(b, 0, v)
          onChange(n)
        }}
      >
        <ol className="flow-draft-list">
          {links.map((l, i) => (
            <Item
              key={l.shotId}
              link={l}
              index={i}
              shot={data[l.shotId] || {}}
              onRemove={() =>
                onChange(links.filter((v) => v.shotId !== l.shotId))
              }
              onPreview={() => setPreview(l.shotId)}
            />
          ))}
        </ol>
      </DragDropProvider>
      {preview && (
        <Overlay
          kind="drawer"
          title={String(data[preview]?.number || 'Shot preview')}
          onClose={() => setPreview(undefined)}
        >
          <div className="flow-form">
            {[
              'subject',
              'coverage',
              'camera',
              'framing',
              'lens',
              'movement',
              'estimatedMinutes',
            ].map((k) => (
              <section key={k}>
                <h3>
                  {k === 'estimatedMinutes' ? 'Shooting estimate' : k}
                </h3>
                <p>{String(data[preview]?.[k] ?? '—')}</p>
              </section>
            ))}
            <a
              className="pd-button"
              target="_blank"
              rel="noopener"
              href={'#/shotlists/' + links[0]?.listId + '?shot=' + preview}
            >
              Open in Shot List
            </a>
          </div>
        </Overlay>
      )}
    </>
  )
}

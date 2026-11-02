import { useEffect, useState } from 'react'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { Link } from 'react-router-dom'
import {
  panelNotes,
  put,
  values,
  type Annotation,
  type ArtworkRevision,
  type Panel,
} from '../../lib/storyboards/model'
import { panelIdentity } from '../../lib/storyboards/panelIdentity'
import CollaborativeText from '../shots/CollaborativeText'
import { Button } from '../whiteout/Button'
import { ErrorNotice } from '../whiteout/Feedback'
import Artwork from './Artwork'
import PanelDiscussion from './PanelDiscussion'
import { StudioGlyph, StudioIcon } from './StudioControls'
import type { LinkedSnapshot } from './ShotPicker'
type Revision = ArtworkRevision & { id: string; panelId: string }
export default function PanelInspector({
  documentId,
  doc,
  panel,
  index,
  user,
  provider,
  undo,
  snapshots,
  revisions,
  viewRevision,
  onPreview,
  onLink,
  onReplace,
  present = false,
}: {
  documentId: string
  doc: Y.Doc
  panel: Panel
  index: number
  user: { id: number; name: string }
  provider: HocuspocusProvider
  undo: Y.UndoManager
  snapshots: Record<string, LinkedSnapshot>
  revisions: Revision[]
  viewRevision: string
  onPreview: (id: string) => void
  onLink: () => void
  onReplace: () => void
  present?: boolean
}) {
  const [tab, setTab] = useState('details'),
    [error, setError] = useState('')
  useEffect(() => {
    setTab('details')
    setError('')
  }, [panel.id])
  const title = panelIdentity(panel, index, snapshots),
    notes = panelNotes(doc, panel.id),
    current = revisions.find((r) => r.id === panel.activeRevision)
  function checkpoint(source: Revision, restore = false) {
    const latest = doc.getMap<Y.Map<unknown>>('panels').get(panel.id)
    if (latest?.get('activeRevision') !== panel.activeRevision) {
      setError(
        'Artwork changed in another session. Review the latest version before restoring.',
      )
      return
    }
    const id =
      (source.kind === 'native' ? 'native-' : 'revision-') + crypto.randomUUID()
    undo.stopCapturing()
    doc.transact(() => {
      put(doc, 'revisions', id, {
        ...source,
        id,
        panelId: panel.id,
        uploader: user.id,
        uploaderName: user.name,
        createdAt: new Date().toISOString(),
        checkpoint: restore ? 'Restored artwork' : 'Saved version',
        ...(restore ? { restoredFrom: source.id } : {}),
      })
      values<Annotation & { revisionId: string }>(doc, 'annotations')
        .filter((a) => a.revisionId === source.id)
        .forEach((a) => {
          const next = crypto.randomUUID()
          put(doc, 'annotations', next, { ...a, id: next, revisionId: id })
        })
      if (restore) put(doc, 'panels', panel.id, { activeRevision: id })
    })
    undo.stopCapturing()
    onPreview('')
    setError('')
  }
  return (
    <aside
      className="sb-panel-inspector sb-refined-inspector"
      aria-label="Panel details"
    >
      {!present && (
        <div
          className="sb-inspector-tabs"
          role="tablist"
          aria-label="Panel inspector"
          style={
            {
              '--tab': String(['details', 'comments', 'history'].indexOf(tab)),
            } as React.CSSProperties
          }
        >
          {(['details', 'comments', 'history'] as const).map((value, i) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => {
                setTab(value)
                if (value !== 'history') onPreview('')
              }}
              onKeyDown={(e) => {
                if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
                  e.preventDefault()
                  const next = (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3
                  setTab(['details', 'comments', 'history'][next])
                  e.currentTarget.parentElement
                    ?.querySelectorAll('button')
                    [next]?.focus()
                }
              }}
            >
              <StudioGlyph
                name={
                  value === 'details'
                    ? 'settings'
                    : value === 'comments'
                      ? 'reply'
                      : 'layers'
                }
              />
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      )}
      <div className="sb-inspector-scroll" role="tabpanel">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {(present || tab === 'details') && (
          <>
            <section className="sb-inspector-section">
              <h3>{title}</h3>
              {!present && (
                <div className="sb-panel-identity-fields">
                  <label>
                    Custom title
                    <input
                      aria-label="Custom panel title"
                      placeholder="Use linked shot or original label"
                      value={panel.title || ''}
                      maxLength={180}
                      onChange={(e) =>
                        put(doc, 'panels', panel.id, { title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Original label
                    <input
                      aria-label="Original label"
                      value={panel.label}
                      maxLength={180}
                      onChange={(e) =>
                        put(doc, 'panels', panel.id, { label: e.target.value })
                      }
                    />
                  </label>
                </div>
              )}
            </section>
            <section className="sb-inspector-section">
              <header>
                <h3>Linked shots</h3>
                {!present && (
                  <StudioIcon name="link" label="Link shots" onClick={onLink} />
                )}
              </header>
              {panel.links.map((l) => {
                const shot = snapshots[l.listId]?.shots[l.shotId]
                return (
                  <div className="sb-linked-shot" key={l.listId + l.shotId}>
                    <div>
                      {shot && !shot.deleted && !shot.deletedAt ? (
                        <>
                          <Link
                            to={`/shotlists/${l.listId}?shot=${l.shotId}&scene=${shot.sceneId}`}
                          >
                            {String(shot.number)}
                            <small> · {l.shotId.slice(0, 8)}</small>
                          </Link>
                          <p>{String(shot.coverage || '')}</p>
                          <small>
                            {['camera', 'framing', 'lens', 'movement']
                              .map((k) => shot[k])
                              .filter(Boolean)
                              .join(' · ')}
                          </small>
                        </>
                      ) : (
                        <small>
                          Linked shot unavailable · {l.shotId.slice(0, 8)}
                        </small>
                      )}
                    </div>
                    {!present && (
                      <StudioIcon
                        name="close"
                        label={`Unlink ${shot?.number || 'shot'}`}
                        onClick={() =>
                          put(doc, 'panels', panel.id, {
                            links: panel.links.filter(
                              (x) =>
                                x.listId !== l.listId || x.shotId !== l.shotId,
                            ),
                          })
                        }
                      />
                    )}
                  </div>
                )
              })}
              {!panel.links.length && (
                <small className="sb-inspector-muted">No linked shots</small>
              )}
            </section>
            <section className="sb-inspector-section">
              <h3>Visual notes</h3>
              {present ? (
                <p>{panel.notes || '—'}</p>
              ) : (
                <div className="sb-visual-notes">
                  <CollaborativeText
                    key={panel.id}
                    text={notes}
                    provider={provider}
                    undo={undo}
                    label="Visual notes"
                  />
                </div>
              )}
            </section>
            {!present && (
              <section className="sb-inspector-section">
                <header>
                  <h3>Artwork</h3>
                  <StudioIcon
                    name="image"
                    label="Replace artwork"
                    onClick={onReplace}
                  />
                </header>
                {current && (
                  <div className="sb-inspector-art">
                    <Artwork
                      documentId={documentId}
                      frame={current.frame}
                      assetId={current.assetId}
                      label="Current artwork"
                      drawingHeight={current.height}
                      drawing={
                        current.kind === 'native'
                          ? values<Annotation & { revisionId: string }>(
                              doc,
                              'annotations',
                            ).filter((a) => a.revisionId === current.id)
                          : undefined
                      }
                    />
                    <span>
                      {current.kind === 'native'
                        ? 'Drawing'
                        : 'Imported artwork'}
                      <small>
                        {new Date(current.createdAt).toLocaleDateString()}
                      </small>
                    </span>
                  </div>
                )}
              </section>
            )}
          </>
        )}
        {!present && tab === 'comments' && (
          <PanelDiscussion doc={doc} panelId={panel.id} user={user} />
        )}
        {!present && tab === 'history' && (
          <section className="sb-history">
            <header>
              <h3>Artwork history</h3>
              {current && (
                <StudioIcon
                  name="plus"
                  label="Save version"
                  onClick={() => checkpoint(current)}
                />
              )}
            </header>
            {viewRevision && (
              <div className="sb-history-preview">
                <small>Read-only preview</small>
                <Button variant="quiet" onClick={() => onPreview('')}>
                  Compare current
                </Button>
              </div>
            )}
            {revisions.map((r, i) => (
              <article
                key={r.id}
                className={
                  r.id === (viewRevision || panel.activeRevision)
                    ? 'is-current'
                    : ''
                }
              >
                <button
                  className="sb-history-item"
                  onClick={() =>
                    onPreview(r.id === panel.activeRevision ? '' : r.id)
                  }
                  aria-pressed={r.id === (viewRevision || panel.activeRevision)}
                >
                  <Artwork
                    documentId={documentId}
                    frame={r.frame}
                    assetId={r.assetId}
                    drawingHeight={r.height}
                    label={`Revision ${revisions.length - i}`}
                    drawing={
                      r.kind === 'native'
                        ? values<Annotation & { revisionId: string }>(
                            doc,
                            'annotations',
                          ).filter((a) => a.revisionId === r.id)
                        : undefined
                    }
                  />
                  <span>
                    <strong>
                      {r.checkpoint || `Revision ${revisions.length - i}`}
                    </strong>
                    <small>{r.uploaderName || `User ${r.uploader}`}</small>
                    <time>
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    {r.id === panel.activeRevision && <em>Current</em>}
                  </span>
                </button>
                {r.id !== panel.activeRevision && (
                  <Button
                    variant="quiet"
                    icon="undo"
                    onClick={() => checkpoint(r, true)}
                  >
                    Restore version
                  </Button>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </aside>
  )
}

import { useEffect, useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import { ErrorNotice } from '../whiteout/Feedback'
import { flowRequest } from '../../lib/flow/api'
type Revision = {
  id: string
  summary: string
  author: string
  createdAt: string
}
export default function FlowHistory({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const [items, setItems] = useState<Revision[]>([]),
    [preview, setPreview] = useState<any>(),
    [selected, setSelected] = useState(''),
    [error, setError] = useState(''),
    [summary, setSummary] = useState(''),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0),
    [confirm, setConfirm] = useState(false)
  useEffect(() => {
    void flowRequest<{ items: Revision[] }>(`/${id}/revisions`)
      .then((r) => setItems(r.items))
      .catch((e) => setError(e.message))
  }, [id, refresh])
  async function action(payload: unknown) {
    setBusy(true)
    try {
      await flowRequest(`/${id}/manage`, payload)
      setRefresh((n) => n + 1)
      setConfirm(false)
      setPreview(undefined)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Overlay title="Flow revisions" onClose={onClose} className="flow-history">
      <div className="flow-history-save">
        <input
          placeholder="Revision summary"
          aria-label="Revision summary"
          value={summary}
          maxLength={300}
          onChange={(e) => setSummary(e.target.value)}
        />
        <Button
          icon="check"
          state={busy ? 'pending' : 'idle'}
          onClick={() =>
            void action({
              action: 'checkpoint',
              summary: summary || 'Saved revision',
            })
          }
        >
          Save revision
        </Button>
      </div>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="flow-history-list">
        {items.map((r) => (
          <article key={r.id}>
            <strong>{r.summary}</strong>
            <small>
              {r.author} · {new Date(r.createdAt).toLocaleString()}
            </small>
            <Button
              icon="file"
              onClick={() => {
                setSelected(r.id)
                void flowRequest(`/${id}/revisions/${r.id}`)
                  .then(setPreview)
                  .catch((e) => setError(e.message))
              }}
            >
              Preview
            </Button>
          </article>
        ))}
        {!items.length && <p className="flow-muted">No saved revisions.</p>}
      </div>
      {preview && (
        <section className="flow-revision-preview">
          <h3>
            {preview.meta.name} · {preview.meta.date || 'Unscheduled'}
          </h3>
          <p>
            {
              Object.values(preview.events).filter((e: any) => !e.deletedAt)
                .length
            }{' '}
            events ·{' '}
            {
              Object.values(preview.departments).filter(
                (d: any) => !d.removedAt,
              ).length
            }{' '}
            departments
          </p>
          <div className="flow-revision-scroll">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(preview.events)
                  .filter((e: any) => !e.deletedAt)
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((e: any) => (
                    <tr key={e.id}>
                      <td>{e.start || 'Unscheduled'}</td>
                      <td>{e.description || e.reference}</td>
                      <td>
                        {Object.values(preview.instructions)
                          .filter((i: any) => i.eventId === e.id && i.text)
                          .map((i: any) => (
                            <p key={i.id}>
                              <strong>
                                {preview.departments[i.departmentId]?.name}
                              </strong>{' '}
                              {i.text}
                            </p>
                          ))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Button icon="undo" onClick={() => setConfirm(true)}>
            Restore this revision
          </Button>
        </section>
      )}
      {confirm && (
        <Overlay
          title="Restore this revision?"
          onClose={() => setConfirm(false)}
          footer={
            <Button
              variant="primary"
              state={busy ? 'pending' : 'idle'}
              onClick={() =>
                void action({ action: 'restoreRevision', revisionId: selected })
              }
            >
              Restore revision
            </Button>
          }
        >
          <p>
            The current Flow is saved as a recoverable revision before
            restoration. The connected Shot List is not changed.
          </p>
        </Overlay>
      )}
    </Overlay>
  )
}

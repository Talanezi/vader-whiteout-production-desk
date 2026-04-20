import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCallSheet } from '../lib/api'

function CallSheetNewPage() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    try {
      setCreating(true)
      setError(null)
      const draft = await createCallSheet({ title: 'Untitled Call Sheet' })
      navigate(`/callsheets/${draft.id}/edit`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create call sheet')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card vw-dashboard-hero">
        <p className="vw-kicker">Call Sheets</p>
        <h1 className="vw-page-title">Start a Call Sheet</h1>
        <p className="vw-page-note">
          Pick a starting point and open the editor.
        </p>
      </section>

      <section className="vw-card-grid vw-card-grid-two">
        <article className="vw-section-card vw-template-card">
          <p className="vw-kicker">Template</p>
          <h2 className="vw-card-title">Blank Production Day</h2>
          <p className="vw-card-copy">
            Start with an empty draft and build the day from scratch.
          </p>
          <div className="vw-actions-row">
            <button className="vw-btn vw-btn-primary" type="button" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create Draft'}
            </button>
          </div>
          {error ? <p className="vw-inline-error">{error}</p> : null}
        </article>

        <article className="vw-section-card vw-template-card">
          <p className="vw-kicker">Template</p>
          <h2 className="vw-card-title">Duplicate Previous Day</h2>
          <p className="vw-card-copy">
            Reuse a previous structure once duplication is added.
          </p>
          <div className="vw-actions-row">
            <button className="vw-btn" type="button">
              Coming Soon
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}

export default CallSheetNewPage

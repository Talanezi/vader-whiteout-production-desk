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

      const draft = await createCallSheet({
        title: 'Untitled Call Sheet',
      })

      navigate(`/callsheets/${draft.id}/edit`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create call sheet')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card">
        <p className="vw-kicker">Call Sheets</p>
        <h1 className="vw-page-title">Create a New Call Sheet</h1>
        <p className="vw-page-note">
          Start a blank production day or open the current builder shell.
        </p>
      </section>

      <section className="vw-card-grid vw-card-grid-two">
        <article className="vw-section-card vw-mini-card">
          <h2 className="vw-card-title">Blank production day</h2>
          <p className="vw-card-copy">
            Start from a clean draft with empty structured sections.
          </p>
          <div className="vw-actions-row">
            <button className="vw-btn vw-btn-primary" type="button" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create draft'}
            </button>
          </div>
          {error ? <p className="vw-inline-error">{error}</p> : null}
        </article>

        <article className="vw-section-card vw-mini-card">
          <h2 className="vw-card-title">Duplicate previous format</h2>
          <p className="vw-card-copy">
            Duplicate a recent day later once saved drafts are wired to the backend.
          </p>
          <div className="vw-actions-row">
            <button className="vw-btn" type="button">
              Coming soon
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}

export default CallSheetNewPage

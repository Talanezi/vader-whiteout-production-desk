import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { CallSheetDraft } from '../data/mockCallSheet'
import { getAuthToken, listCallSheets } from '../lib/api'

function DashboardPage() {
  const token = getAuthToken()
  const [items, setItems] = useState<CallSheetDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (!token) {
      setLoading(false)
      setItems([])
      setError(null)
      return
    }

    listCallSheets()
      .then((data) => {
        if (!active) return
        setItems(data.items)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setItems([])
        setError(err instanceof Error ? err.message : 'Failed to load call sheets')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card vw-dashboard-hero">
        <p className="vw-kicker">Production Desk</p>
        <h1 className="vw-page-title">Production Workspace</h1>
        <p className="vw-page-note">
          Call sheets, shot planning, and production paperwork in one internal workspace.
        </p>
      </section>

      <section className="vw-dashboard-grid">
        <article className="vw-section-card vw-module-card">
          <div className="vw-module-header">
            <div>
              <p className="vw-kicker">Documents</p>
              <h2 className="vw-card-title">Call Sheets</h2>
            </div>
            <Link className="vw-btn vw-btn-primary" to="/callsheets/new">
              New Call Sheet
            </Link>
          </div>

          <div className="vw-list-block">
            {loading ? (
              <div className="vw-empty-block">Loading call sheets...</div>
            ) : error ? (
              <div className="vw-empty-block">{error}</div>
            ) : items.length === 0 ? (
              <div className="vw-empty-block">No call sheets yet.</div>
            ) : (
              items.slice(0, 8).map((item) => (
                <div key={item.id} className="vw-list-row">
                  <div className="vw-list-copy">
                    <div className="vw-list-title">{item.title || 'Untitled Call Sheet'}</div>
                    <div className="vw-list-meta">{item.productionDate || 'No date set'}</div>
                  </div>

                  <div className="vw-list-actions">
                    <Link className="vw-inline-link" to={`/callsheets/${item.id}/edit`}>
                      Open
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="vw-section-card vw-module-card">
          <div className="vw-module-header">
            <div>
              <p className="vw-kicker">Planning</p>
              <h2 className="vw-card-title">Shot Lists</h2>
            </div>
            <button className="vw-btn" type="button">
              Soon
            </button>
          </div>

          <div className="vw-empty-block">
            Shot list workspace not added yet.
          </div>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage

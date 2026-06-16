import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { CallSheetDraft, CallSheetStatus } from '../data/mockCallSheet'
import { callSheetStatusLabels } from '../data/mockCallSheet'
import { getAuthToken, listCallSheets } from '../lib/api'

type DashboardGroup = {
  title: string
  kicker: string
  statuses: CallSheetStatus[]
  emptyCopy: string
}

const workflowGroups: DashboardGroup[] = [
  {
    title: 'Needs Work / Drafts',
    kicker: 'In Progress',
    statuses: ['draft'],
    emptyCopy: 'No draft call sheets need work.',
  },
  {
    title: 'Ready for AD Review',
    kicker: 'Review Queue',
    statuses: ['ready_for_review'],
    emptyCopy: 'No call sheets are waiting for AD review.',
  },
  {
    title: 'Approved / Published Archive',
    kicker: 'Locked',
    statuses: ['approved', 'published'],
    emptyCopy: 'No approved or published call sheets yet.',
  },
  {
    title: 'Revised',
    kicker: 'Updates',
    statuses: ['revised'],
    emptyCopy: 'No revised call sheets yet.',
  },
]

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

  const getStatus = (item: CallSheetDraft): CallSheetStatus => item.status || 'draft'

  const getGroupItems = (statuses: CallSheetStatus[]) =>
    items.filter((item) => statuses.includes(getStatus(item)))

  const renderCallSheetRow = (item: CallSheetDraft) => {
    const status = getStatus(item)

    return (
      <div key={item.id} className="vw-list-row vw-call-sheet-row">
        <div className="vw-list-copy">
          <div className="vw-list-title">{item.title || 'Untitled Call Sheet'}</div>
          <div className="vw-list-meta">
            {item.productionDate || 'No date set'} • Primary Call {item.primaryCallTime || 'Not set'}
          </div>
        </div>

        <div className="vw-list-actions vw-call-sheet-actions">
          <span className={`status-badge dashboard-status-badge dashboard-status-badge-${status}`}>
            {callSheetStatusLabels[status]}
          </span>
          <Link className="vw-inline-link" to={`/callsheets/${item.id}/edit`}>
            Open/Edit
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card vw-dashboard-hero">
        <div className="vw-dashboard-hero-inner">
          <div>
            <p className="vw-kicker">Production Desk</p>
            <h1 className="vw-page-title">Production Workspace</h1>
            <p className="vw-page-note">
              Call sheets grouped by workflow status for the next production move.
            </p>
          </div>

          <Link className="vw-btn vw-btn-primary" to="/callsheets/new">
            New Call Sheet
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="vw-empty-block">Loading call sheets...</div>
      ) : error ? (
        <div className="vw-empty-block">{error}</div>
      ) : items.length === 0 ? (
        <div className="vw-empty-block">No call sheets yet.</div>
      ) : null}

      <section className="vw-dashboard-grid vw-workflow-grid">
        {workflowGroups.map((group) => {
          const groupItems = getGroupItems(group.statuses)

          return (
            <article key={group.title} className="vw-section-card vw-module-card vw-workflow-card">
              <div className="vw-module-header">
                <div>
                  <p className="vw-kicker">{group.kicker}</p>
                  <h2 className="vw-card-title">{group.title}</h2>
                </div>
                <span className="vw-count-badge">{groupItems.length}</span>
              </div>

              <div className="vw-list-block">
                {loading || error || items.length === 0 ? null : groupItems.length === 0 ? (
                  <div className="vw-empty-block">{group.emptyCopy}</div>
                ) : (
                  groupItems.map(renderCallSheetRow)
                )}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default DashboardPage

import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { CallSheetDraft, CallSheetStatus } from '../data/mockCallSheet'
import { callSheetStatusLabels } from '../data/mockCallSheet'
import { downloadPdfFile, duplicateCallSheet, getAuthToken, listCallSheets } from '../lib/api'

type DashboardGroup = {
  title: string
  statuses: CallSheetStatus[]
  emptyCopy: string
}

const workflowGroups: DashboardGroup[] = [
  {
    title: 'Needs Work',
    statuses: ['draft'],
    emptyCopy: 'Draft call sheets that still need production details will appear here.',
  },
  {
    title: 'Ready for AD Review',
    statuses: ['ready_for_review'],
    emptyCopy: 'Sheets sent to the AD review queue will appear here.',
  },
  {
    title: 'Approved for Distribution',
    statuses: ['approved'],
    emptyCopy: 'Approved sheets waiting to be published will appear here.',
  },
  {
    title: 'Published Archive',
    statuses: ['published'],
    emptyCopy: 'Published call sheets ready for the crew archive will appear here.',
  },
  {
    title: 'Revised Sheets',
    statuses: ['revised'],
    emptyCopy: 'Revised sheets that need another pass will appear here.',
  },
]

function DashboardPage() {
  const token = getAuthToken()
  const [items, setItems] = useState<CallSheetDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

  const handleDuplicate = async (item: CallSheetDraft) => {
    try {
      setDuplicatingId(item.id)
      setError(null)
      const copied = await duplicateCallSheet(item.id)
      setItems((prev) => [copied, ...prev])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate call sheet')
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleDownloadPdf = async (item: CallSheetDraft) => {
    try {
      setDownloadingId(item.id)
      setError(null)
      await downloadPdfFile(item.id, item.title)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF')
    } finally {
      setDownloadingId(null)
    }
  }

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
          <button className="vw-inline-action" type="button" onClick={() => handleDownloadPdf(item)} disabled={downloadingId === item.id}>
            {downloadingId === item.id ? 'Preparing…' : 'PDF'}
          </button>
          <button className="vw-inline-action" type="button" onClick={() => handleDuplicate(item)} disabled={duplicatingId === item.id}>
            {duplicatingId === item.id ? 'Duplicating…' : 'Duplicate'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card vw-dashboard-hero">
        <div className="vw-dashboard-hero-inner">
          <div>
            <h1 className="vw-page-title">Production Desk</h1>
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

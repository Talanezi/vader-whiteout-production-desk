import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { CallSheetDraft, CallSheetStatus } from '../data/mockCallSheet'
import { callSheetStatusLabels, callSheetStatuses, distributionStatusLabels } from '../data/mockCallSheet'
import { deleteCallSheet, downloadPdfFile, duplicateCallSheet, getAuthToken, listCallSheets, listRosterPeople } from '../lib/api'

type DashboardGroup = {
  title: string
  statuses: CallSheetStatus[]
  emptyCopy: string
}

type SortMode = 'production_date' | 'title'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CallSheetStatus>('all')
  const [sortMode, setSortMode] = useState<SortMode>('production_date')
  const [rosterCount, setRosterCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    if (!token) {
      setLoading(false)
      setItems([])
      setError(null)
      return
    }

    Promise.allSettled([listCallSheets(), listRosterPeople()])
      .then(([callSheetsResult, rosterResult]) => {
        if (!active) return

        if (callSheetsResult.status === 'fulfilled') {
          setItems(callSheetsResult.value.items)
          setError(null)
        } else {
          setItems([])
          setError(callSheetsResult.reason instanceof Error ? callSheetsResult.reason.message : 'Failed to load call sheets')
        }

        if (rosterResult.status === 'fulfilled') {
          setRosterCount(rosterResult.value.total)
        } else {
          setRosterCount(null)
        }
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

  const getDateTime = (value: string) => {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = (item.title || 'Untitled Call Sheet').toLowerCase().includes(searchQuery.trim().toLowerCase())
      const matchesStatus = statusFilter === 'all' || getStatus(item) === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortMode === 'title') {
        return (a.title || 'Untitled Call Sheet').localeCompare(b.title || 'Untitled Call Sheet')
      }

      const aTime = getDateTime(a.productionDate)
      const bTime = getDateTime(b.productionDate)

      if (aTime !== null && bTime !== null) return aTime - bTime
      if (aTime !== null) return -1
      if (bTime !== null) return 1
      return (a.title || 'Untitled Call Sheet').localeCompare(b.title || 'Untitled Call Sheet')
    })

  const getGroupItems = (statuses: CallSheetStatus[]) =>
    filteredItems.filter((item) => statuses.includes(getStatus(item)))

  const draftCount = items.filter((item) => getStatus(item) === 'draft').length
  const reviewCount = items.filter((item) => getStatus(item) === 'ready_for_review').length
  const publishedCount = items.filter((item) => getStatus(item) === 'published').length

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSortMode('production_date')
  }

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

  const handleDelete = async (item: CallSheetDraft) => {
    const ok = window.confirm(`Delete "${item.title || 'Untitled Call Sheet'}"?`)
    if (!ok) return

    try {
      setDeletingId(item.id)
      setError(null)
      await deleteCallSheet(item.id)
      setItems((prev) => prev.filter((candidate) => candidate.id !== item.id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete call sheet')
    } finally {
      setDeletingId(null)
    }
  }

  const getDistributionSummary = (item: CallSheetDraft) => {
    const recipients = item.distributionRecipients || []
    const included = recipients.filter((recipient) => recipient.included)
    if (included.length === 0) return 'No distribution list yet'

    const confirmed = included.filter((recipient) => recipient.confirmationStatus === 'confirmed').length
    const noResponse = included.filter((recipient) => recipient.confirmationStatus === 'no_response').length
    const issue = included.filter((recipient) => recipient.confirmationStatus === 'issue').length

    return `${included.length} recipients · ${confirmed} confirmed · ${noResponse} no response · ${issue} issue`
  }

  const renderCallSheetRow = (item: CallSheetDraft) => {
    const status = getStatus(item)
    const distributionStatus = item.distributionStatus || 'not_ready'

    return (
      <div key={item.id} className="vw-list-row vw-call-sheet-row">
        <div className="vw-list-copy">
          <div className="vw-list-title">{item.title || 'Untitled Call Sheet'}</div>
          <div className="vw-list-meta">
            {item.productionDate || 'No production date set'} • Primary Crew Call {item.primaryCallTime || 'Not set'}
          </div>
          <div className="vw-list-meta distribution-dashboard-meta">
            {distributionStatusLabels[distributionStatus]} • {getDistributionSummary(item)}
          </div>
        </div>

        <div className="vw-list-actions vw-call-sheet-actions">
          <span className={`status-badge dashboard-status-badge dashboard-status-badge-${status}`}>
            {callSheetStatusLabels[status]}
          </span>
          <span className={`status-badge distribution-status-badge distribution-status-badge-${distributionStatus}`}>
            {distributionStatusLabels[distributionStatus]}
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
          <button className="vw-inline-action vw-inline-action-danger" type="button" onClick={() => handleDelete(item)} disabled={deletingId === item.id}>
            {deletingId === item.id ? 'Deleting…' : 'Delete'}
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
        <div className="vw-empty-block">No call sheets yet. Start with a template to build the first production day.</div>
      ) : null}

      {!loading && !error ? (
        <section className="dashboard-stats panel">
          <div className="summary-item">
            <span>Total Call Sheets</span>
            <strong>{items.length}</strong>
          </div>
          <div className="summary-item">
            <span>Drafts Needing Work</span>
            <strong>{draftCount}</strong>
          </div>
          <div className="summary-item">
            <span>Ready for Review</span>
            <strong>{reviewCount}</strong>
          </div>
          <div className="summary-item">
            <span>Published Archive</span>
            <strong>{publishedCount}</strong>
          </div>
          <div className="summary-item">
            <span>Roster</span>
            <strong>{rosterCount ?? '—'}</strong>
          </div>
        </section>
      ) : null}

      <section className="dashboard-controls panel">
        <label className="dashboard-control">
          <span>Search title</span>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search call sheets" />
        </label>

        <label className="dashboard-control">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | CallSheetStatus)}>
            <option value="all">All statuses</option>
            {callSheetStatuses.map((status) => (
              <option key={status} value={status}>{callSheetStatusLabels[status]}</option>
            ))}
          </select>
        </label>

        <label className="dashboard-control">
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
            <option value="production_date">Production date</option>
            <option value="title">Title</option>
          </select>
        </label>

        <button className="vw-btn" type="button" onClick={clearFilters} disabled={!searchQuery && statusFilter === 'all' && sortMode === 'production_date'}>
          Clear
        </button>
      </section>

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

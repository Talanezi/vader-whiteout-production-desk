import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { CallSheetDraft, CallSheetStatus } from '../data/mockCallSheet'
import {
  callSheetStatuses,
  distributionStatusLabels,
} from '../data/mockCallSheet'
import {
  deleteCallSheet,
  downloadPdfFile,
  duplicateCallSheet,
  getAuthToken,
  listCallSheets,
} from '../lib/api'
import { Button } from '../components/whiteout/Button'
import Icon from '../components/whiteout/Icon'
import Menu from '../components/whiteout/Menu'
import { Confirm } from '../components/whiteout/Overlay'
import {
  EmptyState,
  ErrorNotice,
  LoadingRows,
  RetryButton,
  SessionState,
  useToast,
} from '../components/whiteout/Feedback'
import {
  PageHeader,
  SearchField,
  Status,
} from '../components/whiteout/Workspace'

const labels: Record<CallSheetStatus, string> = {
  draft: 'Draft',
  ready_for_review: 'In review',
  approved: 'Approved',
  published: 'Published',
  revised: 'Revised',
}
const displayDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : value
type Sort = 'production_date' | 'title'
function DashboardPage() {
  const token = getAuthToken(),
    navigate = useNavigate(),
    notify = useToast()
  const [items, setItems] = useState<CallSheetDraft[]>([]),
    [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null),
    [actionError, setActionError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0),
    [pending, setPending] = useState<Record<string, string>>({})
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState<'all' | CallSheetStatus>('all'),
    [sort, setSort] = useState<Sort>('production_date')
  const [deleting, setDeleting] = useState<CallSheetDraft | null>(null),
    [deleteError, setDeleteError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    listCallSheets()
      .then((data) => {
        if (active) setItems(data.items)
      })
      .catch((error) => {
        if (active)
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Could not load call sheets.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, attempt])
  const unauthorized = !token || loadError === 'UNAUTHORIZED'
  const filtered = items
    .filter(
      (item) =>
        (filter === 'all' || (item.status || 'draft') === filter) &&
        (item.title || 'Untitled Call Sheet')
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === 'title')
        return (a.title || 'Untitled Call Sheet').localeCompare(
          b.title || 'Untitled Call Sheet',
        )
      const x = Date.parse(a.productionDate),
        y = Date.parse(b.productionDate)
      if (!Number.isNaN(x) && !Number.isNaN(y)) return x - y
      if (!Number.isNaN(x)) return -1
      if (!Number.isNaN(y)) return 1
      return (a.title || '').localeCompare(b.title || '')
    })
  const clear = () => {
    setSearch('')
    setFilter('all')
  }
  async function action(
    item: CallSheetDraft,
    type: 'duplicate' | 'pdf' | 'delete',
  ) {
    setPending((old) => ({ ...old, [item.id]: type }))
    setActionError(null)
    setDeleteError(null)
    try {
      if (type === 'duplicate') {
        const copy = await duplicateCallSheet(item.id)
        setItems((old) => [copy, ...old])
        notify('Call sheet duplicated.')
      }
      if (type === 'pdf') {
        await downloadPdfFile(item.id, item.title)
        notify('PDF is ready to download.')
      }
      if (type === 'delete') {
        await deleteCallSheet(item.id)
        setItems((old) => old.filter((x) => x.id !== item.id))
        setDeleting(null)
        notify('Call sheet deleted.')
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'UNAUTHORIZED'
          ? 'Your session has expired. Sign in again.'
          : error instanceof Error
            ? error.message
            : 'The action could not be completed. Try again.'
      if (type === 'delete') setDeleteError(message)
      else setActionError(message)
    } finally {
      setPending((old) => {
        const next = { ...old }
        delete next[item.id]
        return next
      })
    }
  }
  return (
    <div className="pd-page">
      {!unauthorized && (
        <>
          <PageHeader title="Call sheets">
            <Link className="pd-button pd-button-primary" to="/callsheets/new">
              <Icon name="plus" />
              New call sheet
            </Link>
          </PageHeader>
        </>
      )}
      {actionError && (
        <ErrorNotice onDismiss={() => setActionError(null)}>
          {actionError}
        </ErrorNotice>
      )}
      {unauthorized ? (
        <SessionState />
      ) : (
        <>
          <div className="pd-toolbar">
            <SearchField
              label="Search call sheets"
              value={search}
              onChange={setSearch}
              placeholder="Search call sheets…"
            />
            <div className="pd-toolbar-options">
              <Menu
                label={filter === 'all' ? 'All statuses' : labels[filter]}
                icon="file"
                value={filter}
                items={[
                  { value: 'all', label: 'All statuses' },
                  ...callSheetStatuses.map((s) => ({
                    value: s,
                    label: labels[s],
                  })),
                ]}
                onChange={(v) => setFilter(v as typeof filter)}
              />
              <Menu
                label={sort === 'title' ? 'Title A–Z' : 'Production date'}
                icon="sort"
                value={sort}
                items={[
                  {
                    value: 'production_date',
                    label: 'Production date',
                    icon: 'calendar',
                  },
                  { value: 'title', label: 'Title A–Z', icon: 'sort' },
                ]}
                onChange={(v) => setSort(v as Sort)}
              />
            </div>
          </div>
          {loading ? (
            <LoadingRows label="Loading call sheets…" />
          ) : loadError ? (
            <EmptyState
              kind="error"
              title="Call sheets couldn’t be loaded"
              action={<RetryButton onClick={() => setAttempt((x) => x + 1)} />}
            >
              {loadError}
            </EmptyState>
          ) : !items.length ? (
            <EmptyState
              title="No call sheets yet"
              action={
                <Link
                  to="/callsheets/new"
                  className="pd-button pd-button-primary"
                >
                  <Icon name="plus" />
                  Create your first call sheet
                </Link>
              }
            ></EmptyState>
          ) : !filtered.length ? (
            <EmptyState
              kind="search"
              title="No matching call sheets"
              action={<Button onClick={clear}>Clear search and filters</Button>}
            ></EmptyState>
          ) : (
            <>
              <div className="pd-table-wrap">
                <table className="pd-table pd-documents">
                  <caption className="pd-sr-only">
                    Production call sheets
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Document</th>
                      <th scope="col">Production date</th>
                      <th scope="col">Status</th>
                      <th scope="col">Distribution</th>
                      <th scope="col">
                        <span className="pd-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const recipients = (
                          item.distributionRecipients || []
                        ).filter((x) => x.included),
                        title = item.title || 'Untitled Call Sheet'
                      const summary = [
                        'sent',
                        'confirmed',
                        'no_response',
                        'issue',
                      ]
                        .map(
                          (status) =>
                            `${recipients.filter((x) => x.confirmationStatus === status).length} ${status.replace('_', ' ')}`,
                        )
                        .join(' · ')
                      return (
                        <tr key={item.id} aria-busy={!!pending[item.id]}>
                          <td className="pd-document-title">
                            <div className="pd-document-mark">
                              <Icon name="file" />
                            </div>
                            <div>
                              <Link to={`/callsheets/${item.id}/edit`}>
                                {title}
                              </Link>
                              <small>
                                {item.primaryCallTime
                                  ? `Crew call ${item.primaryCallTime}`
                                  : 'Crew call not set'}
                              </small>
                            </div>
                          </td>
                          <td data-label="Production date">
                            <span>
                              {displayDate(item.productionDate) || 'Not set'}
                            </span>
                          </td>
                          <td data-label="Status">
                            <Status value={item.status || 'draft'}>
                              {labels[item.status || 'draft']}
                            </Status>
                          </td>
                          <td
                            className="pd-distribution"
                            data-label="Distribution"
                          >
                            {recipients.length ? (
                              <details>
                                <summary>
                                  {
                                    distributionStatusLabels[
                                      item.distributionStatus || 'not_ready'
                                    ]
                                  }
                                  <Icon name="chevron" />
                                </summary>
                                <small>{recipients.length} recipients</small>
                                <p>
                                  {summary} ·{' '}
                                  {recipients.filter((x) => !x.email).length}{' '}
                                  missing email
                                </p>
                              </details>
                            ) : (
                              <>
                                <span>
                                  {
                                    distributionStatusLabels[
                                      item.distributionStatus || 'not_ready'
                                    ]
                                  }
                                </span>
                                <small>No recipients yet</small>
                              </>
                            )}
                          </td>
                          <td className="pd-row-actions">
                            {pending[item.id] && (
                              <span className="pd-row-pending" role="status">
                                <span className="pd-spinner" />
                                {pending[item.id] === 'pdf'
                                  ? 'Preparing PDF'
                                  : pending[item.id] === 'delete'
                                    ? 'Deleting'
                                    : 'Duplicating'}
                              </span>
                            )}
                            <Menu
                              compact
                              label={`Actions for ${title}`}
                              icon="more"
                              disabled={!!pending[item.id]}
                              items={[
                                {
                                  value: 'open',
                                  label: 'Open in editor',
                                  icon: 'edit',
                                  onSelect: () =>
                                    navigate(`/callsheets/${item.id}/edit`),
                                },
                                {
                                  value: 'pdf',
                                  label: 'Download PDF',
                                  icon: 'download',
                                  onSelect: () => void action(item, 'pdf'),
                                },
                                {
                                  value: 'duplicate',
                                  label: 'Duplicate call sheet',
                                  icon: 'copy',
                                  onSelect: () =>
                                    void action(item, 'duplicate'),
                                },
                                {
                                  value: 'delete',
                                  label: 'Delete call sheet',
                                  icon: 'trash',
                                  danger: true,
                                  onSelect: () => {
                                    setDeleteError(null)
                                    setDeleting(item)
                                  },
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="pd-list-footer">
                <span>
                  {filtered.length === items.length
                    ? `${items.length} call sheets`
                    : `${filtered.length} of ${items.length} call sheets`}
                </span>
                {(search || filter !== 'all') && (
                  <Button variant="quiet" onClick={clear}>
                    Clear filters
                  </Button>
                )}
                <span>
                  Sorted by {sort === 'title' ? 'title' : 'production date'}
                </span>
              </div>
            </>
          )}
        </>
      )}
      {deleting && (
        <Confirm
          title="Delete this call sheet?"
          description={`“${deleting.title || 'Untitled Call Sheet'}” will be removed from your production documents.`}
          pending={pending[deleting.id] === 'delete'}
          error={deleteError}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void action(deleting, 'delete')}
        />
      )}
    </div>
  )
}
export default DashboardPage

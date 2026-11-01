import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/whiteout/Workspace'
import {
  EmptyState,
  ErrorNotice,
  LoadingRows,
  SessionState,
  useToast,
} from '../components/whiteout/Feedback'
import { Button } from '../components/whiteout/Button'
import { Overlay, Confirm } from '../components/whiteout/Overlay'
import DatePicker from '../components/whiteout/DatePicker'
import Menu from '../components/whiteout/Menu'
import { getAuthToken } from '../lib/api'
import { shotRequest, type ShotListMetadata } from '../lib/shotApi'

export default function ShotListsPage() {
  const location = useLocation(),
    navigate = useNavigate(),
    notify = useToast(),
    token = getAuthToken()
  const [renaming, setRenaming] = useState<ShotListMetadata | null>(null),
    [deleteId, setDeleteId] = useState('')
  const [deletePending, setDeletePending] = useState(false),
    [deleteError, setDeleteError] = useState<string | null>(null)
  const creating = location.pathname.endsWith('/new')
  const [items, setItems] = useState<ShotListMetadata[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0)
  const [firstDate, setFirstDate] = useState(''),
    [dateValid, setDateValid] = useState(true)
  const [name, setName] = useState(''),
    [pending, setPending] = useState(false)
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    shotRequest<{ items: ShotListMetadata[] }>('')
      .then((r) => {
        if (alive) setItems(r.items)
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [token, attempt])
  if (!token || error === 'UNAUTHORIZED') return <SessionState />
  async function create() {
    if (!name.trim() || !dateValid) return
    setPending(true)
    setError('')
    try {
      const list = await notify.promise(
        shotRequest<ShotListMetadata>('', { name: name.trim(), firstDate }),
        {
          pending: 'Creating shot list…',
          success: 'Shot list created.',
          error: 'Could not create the shot list.',
        },
      )
      navigate(`/shotlists/${list.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Creation failed.')
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="pd-page">
      <PageHeader title="Shot lists" />
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {loading ? (
        <LoadingRows label="Loading shot lists…" />
      ) : items.length ? (
        <div className="pd-table-wrap">
          <table
            className="pd-table pd-documents"
            aria-label="Production shot lists"
          >
            <thead>
              <tr>
                <th>Document</th>
                <th>Scenes / Shots</th>
                <th>Planned shoot date</th>
                <th>
                  <span className="pd-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="pd-document-title">
                    <div>
                      <Link to={`/shotlists/${item.id}`}>{item.name}</Link>
                    </div>
                  </td>
                  <td data-label="Scenes / Shots">
                    {item.sceneCount ?? 0} scenes · {item.shotCount ?? 0} shots
                  </td>
                  <td data-label="Planned shoot date">
                    {item.dates?.length
                      ? item.dates
                          .map((d) =>
                            new Date(d + 'T12:00:00Z').toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                timeZone: 'UTC',
                              },
                            ),
                          )
                          .join(' – ')
                      : '—'}
                  </td>
                  <td>
                    <Menu
                      label={`Actions for ${item.name}`}
                      compact
                      items={[
                        {
                          value: 'open',
                          label: 'Open',
                          onSelect: () => navigate(`/shotlists/${item.id}`),
                        },
                        {
                          value: 'rename',
                          label: 'Rename',
                          onSelect: () => {
                            setName(item.name)
                            setRenaming(item)
                          },
                        },
                        {
                          value: 'delete',
                          label: 'Delete',
                          danger: true,
                          onSelect: () => setDeleteId(item.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={error ? 'Shot lists unavailable' : 'No shot lists yet'}
          action={
            error ? (
              <Button
                icon="retry"
                onClick={() => {
                  setError('')
                  setAttempt((x) => x + 1)
                }}
              >
                Try again
              </Button>
            ) : undefined
          }
        />
      )}
      {deleteId && (
        <Confirm
          title="Delete this shot list?"
          description={`“${items.find((i) => i.id === deleteId)?.name || 'Shot List'}” will be removed from your production documents.`}
          pending={deletePending}
          error={deleteError}
          onCancel={() => {
            setDeleteId('')
            setDeleteError(null)
          }}
          onConfirm={async () => {
            setDeletePending(true)
            setDeleteError(null)
            try {
              await shotRequest(`/${deleteId}/manage`, { action: 'archive' })
              setItems((old) => old.filter((i) => i.id !== deleteId))
              setDeleteId('')
              notify('Shot list archived.')
            } catch (e) {
              setDeleteError((e as Error).message)
            } finally {
              setDeletePending(false)
            }
          }}
        />
      )}
      {renaming && (
        <Overlay
          title="Rename shot list"
          onClose={() => setRenaming(null)}
          footer={
            <>
              <Button onClick={() => setRenaming(null)}>Cancel</Button>
              <Button
                disabled={!name.trim()}
                onClick={async () => {
                  try {
                    await shotRequest(`/${renaming.id}/manage`, {
                      action: 'rename',
                      name,
                    })
                    setItems((old) =>
                      old.map((i) =>
                        i.id === renaming.id ? { ...i, name } : i,
                      ),
                    )
                    setRenaming(null)
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                Save
              </Button>
            </>
          }
        >
          <label className="pd-field">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={180}
            />
          </label>
        </Overlay>
      )}
      {creating && (
        <Overlay
          title="New shot list"
          busy={pending}
          onClose={() => navigate('/shotlists')}
          footer={
            <>
              <Button disabled={pending} onClick={() => navigate('/shotlists')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon="plus"
                disabled={!name.trim() || !dateValid}
                state={pending ? 'pending' : 'idle'}
                pendingLabel="Creating…"
                onClick={create}
              >
                Create shot list
              </Button>
            </>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void create()
            }}
          >
            <label className="pd-field">
              <span>Name</span>
              <input
                data-initial-focus
                autoComplete="off"
                maxLength={180}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Whiteout · coverage plan"
                required
              />
            </label>
            <DatePicker
              label="First planned shooting date (optional)"
              value={firstDate}
              onValidityChange={setDateValid}
              onChange={setFirstDate}
            />
          </form>
        </Overlay>
      )}
    </div>
  )
}

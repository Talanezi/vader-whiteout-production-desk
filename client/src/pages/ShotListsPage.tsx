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
import { Overlay } from '../components/whiteout/Overlay'
import DatePicker from '../components/whiteout/DatePicker'
import Icon from '../components/whiteout/Icon'
import { getAuthToken } from '../lib/api'
import { shotRequest, type ShotListMetadata } from '../lib/shotApi'

export default function ShotListsPage() {
  const location = useLocation(),
    navigate = useNavigate(),
    notify = useToast(),
    token = getAuthToken()
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
        <div className="pd-shot-list-index">
          {items.map((item) => (
            <Link to={`/shotlists/${item.id}`} key={item.id}>
              <strong>
                {item.name}
                <small>
                  {item.sceneCount ?? 0} scenes · {item.shotCount ?? 0} shots
                </small>
              </strong>
              <span>
                {item.dates?.length
                  ? item.dates.length === 1
                    ? item.dates[0]
                    : `${item.dates[0]} – ${item.dates[item.dates.length - 1]}`
                  : 'Not scheduled'}
              </span>
              <Icon name="arrow" />
            </Link>
          ))}
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

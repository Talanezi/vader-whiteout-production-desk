import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageHeader, SearchField } from '../components/whiteout/Workspace'
import { Button } from '../components/whiteout/Button'
import Menu from '../components/whiteout/Menu'
import DocumentRow from '../components/whiteout/DocumentRow'
import { Overlay } from '../components/whiteout/Overlay'
import {
  ErrorNotice,
  LoadingRows,
  SessionState,
  useToast,
} from '../components/whiteout/Feedback'
import { getAuthToken } from '../lib/api'
import { localCandidates } from '../lib/flow/model'
import { shotRequest } from '../lib/shotApi'
import { flowRequest } from '../lib/flow/api'
import ShotPicker from '../components/storyboards/ShotPicker'
import type { ShotLink } from '../lib/storyboards/model'
import FlowIdentity from '../components/flow/FlowIdentity'
import '../components/flow/flow.css'
type Item = {
  id: string
  name: string
  date: string
  status: string
  author: string
  eventCount: number
  revisionCount?: number
  listName?: string
  listId?: string
  updatedAt: string
}
export default function FlowsPage() {
  const navigate = useNavigate(),
    location = useLocation(),
    toast = useToast(),
    request = useRef(crypto.randomUUID())
  const [items, setItems] = useState<Item[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [sort, setSort] = useState('date'),
    [refresh, setRefresh] = useState(0),
    [name, setName] = useState(''),
    [date, setDate] = useState(''),
    [zone, setZone] = useState('America/Los_Angeles'),
    [workflow, setWorkflow] = useState('shots'),
    [links, setLinks] = useState<ShotLink[]>([]),
    [selectedShots, setSelectedShots] = useState<
      Record<string, Record<string, unknown>>
    >({}),
    [startLocal, setStartLocal] = useState(''),
    [previous, setPrevious] = useState(''),
    [picker, setPicker] = useState(false),
    [pending, setPending] = useState(false),
    [remove, setRemove] = useState<Item>(),
    [rename, setRename] = useState<Item>()
  const creating = location.pathname.endsWith('/new')
  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false)
      return
    }
    let alive = true
    flowRequest<{ items: Item[] }>('')
      .then((r) => alive && setItems(r.items))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [refresh])
  async function manage(id: string, action: string, title?: string) {
    setPending(true)
    try {
      const r = await flowRequest<{ id: string }>(`/${id}/manage`, {
        action,
        name: title,
      })
      if (action === 'archive')
        toast('Flow deleted.', {
          action: {
            label: 'Restore',
            run: () => {
              void flowRequest(`/${id}/manage`, { action: 'restore' })
                .then(() => setRefresh((n) => n + 1))
                .catch((e) => toast(e.message, { state: 'error' }))
            },
          },
        })
      if (action === 'duplicate') navigate(`/flows/${r.id}`)
      setRename(undefined)
      setRemove(undefined)
      setRefresh((n) => n + 1)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }
  async function create() {
    setPending(true)
    setError('')
    try {
      if (workflow === 'previous') {
        if (!previous) throw Error('Choose a previous Flow.')
        const copy = await flowRequest<{ id: string }>(`/${previous}/manage`, {
          action: 'duplicate',
          name,
          date,
          zone,
        })
        navigate(`/flows/${copy.id}`)
        return
      }
      const candidates = startLocal.trim()
        ? localCandidates(startLocal.trim(), zone)
        : []
      if (startLocal.trim() && candidates.length !== 1)
        throw Error('Choose an unambiguous production-local filming start.')
      const r = await flowRequest<{ id: string }>('', {
        id: request.current,
        name,
        date,
        zone,
        start: candidates[0] || null,
        ...(workflow === 'shots'
          ? { listId: links[0]?.listId, shotIds: links.map((l) => l.shotId) }
          : {}),
      })
      navigate(`/flows/${r.id}${workflow === 'import' ? '?import=1' : ''}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }
  if (!getAuthToken() || error === 'UNAUTHORIZED') return <SessionState />
  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === 'title'
        ? a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
        : sort === 'modified'
          ? b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id)
          : (a.date || '9999').localeCompare(b.date || '9999') ||
            a.name.localeCompare(b.name) ||
            a.id.localeCompare(b.id),
    )
  return (
    <div className="pd-page">
      <PageHeader title="Flow of the Day">
        <Button
          icon="plus"
          variant="primary"
          onClick={() => navigate('/flows/new')}
        >
          New Flow
        </Button>
      </PageHeader>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="pd-toolbar">
        <SearchField
          label="Search flows"
          placeholder="Search flows..."
          value={search}
          onChange={setSearch}
        />
        <Menu
          label={
            {
              date: 'Production date',
              title: 'Title A–Z',
              modified: 'Last modified',
            }[sort] || ''
          }
          icon="sort"
          value={sort}
          onChange={setSort}
          items={[
            { value: 'date', label: 'Production date' },
            { value: 'title', label: 'Title A–Z' },
            { value: 'modified', label: 'Last modified' },
          ]}
        />
      </div>
      {loading ? (
        <LoadingRows label="Loading flows…" />
      ) : items.length ? (
        <div className="pd-table-wrap">
          <table
            className="pd-table pd-documents"
            aria-label="Production flows"
          >
            <thead>
              <tr>
                <th>Document</th>
                <th>Production date</th>
                <th>Status</th>
                <th>Events</th>
                <th>Last modified / author</th>
                <th>
                  <span className="pd-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <DocumentRow key={i.id} to={`/flows/${i.id}`}>
                  <td className="pd-document-title">
                    <Link className="pd-document-link" to={`/flows/${i.id}`}>
                      {i.name}
                    </Link>
                    {i.listId && (
                      <small>{i.listName || 'Shot List unavailable'}</small>
                    )}
                  </td>
                  <td>{i.date || 'Unscheduled'}</td>
                  <td>
                    <span className="pd-status">
                      {i.status || 'draft'} · {i.revisionCount || 0} revisions
                    </span>
                  </td>
                  <td>{i.eventCount}</td>
                  <td>
                    {new Date(i.updatedAt).toLocaleDateString()}
                    <small>{i.author}</small>
                  </td>
                  <td className="pd-row-actions">
                    <Menu
                      compact
                      label={`Actions for ${i.name}`}
                      items={[
                        {
                          value: 'open',
                          label: 'Open',
                          onSelect: () => navigate(`/flows/${i.id}`),
                        },
                        {
                          value: 'rename',
                          label: 'Rename',
                          onSelect: () => {
                            setName(i.name)
                            setRename(i)
                          },
                        },
                        {
                          value: 'duplicate',
                          label: 'Duplicate for another day',
                          onSelect: () => void manage(i.id, 'duplicate'),
                        },
                        {
                          value: 'archive',
                          label: 'Delete',
                          danger: true,
                          onSelect: () => setRemove(i),
                        },
                      ]}
                    />
                  </td>
                </DocumentRow>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="flow-empty">No flows match your search.</p>
          )}
        </div>
      ) : (
        <div className="flow-empty">
          <FlowIdentity />
          <h2>Plan the production day</h2>
          <Button
            icon="plus"
            variant="primary"
            onClick={() => navigate('/flows/new')}
          >
            Create Flow of the Day
          </Button>
        </div>
      )}
      {creating && (
        <Overlay
          title="New Flow of the Day"
          onClose={() => navigate('/flows')}
          className="flow-create"
          footer={
            <Button
              variant="primary"
              state={pending ? 'pending' : 'idle'}
              onClick={() => void create()}
              disabled={!name.trim() || (workflow === 'shots' && !links.length)}
            >
              Create Flow
            </Button>
          }
        >
          <div className="flow-create-modes">
            {[
              ['shots', 'shots', 'From Shot List'],
              ['import', 'import', 'Import Excel'],
              ['blank', 'file', 'Start blank'],
              ['previous', 'copy', 'Use previous day'],
            ].map(([id, icon, label]) => (
              <Button
                key={id}
                icon={icon as 'shots'}
                variant={workflow === id ? 'primary' : 'secondary'}
                onClick={() => setWorkflow(id)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flow-form">
            <label>
              Title
              <input
                data-initial-focus
                value={name}
                maxLength={180}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Production date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Production timezone
              <input value={zone} onChange={(e) => setZone(e.target.value)} />
            </label>
          </div>
          {workflow === 'shots' && (
            <section className="flow-creation-shots">
              <label className="flow-field">
                Optional filming start · production local
                <input
                  placeholder="YYYY-MM-DD HH:mm"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </label>
              <Button icon="shots" onClick={() => setPicker(true)}>
                {links.length
                  ? `${links.length} shots selected`
                  : 'Choose Shot List and shots'}
              </Button>
              {links.length > 0 && (
                <>
                  <p className="flow-muted">
                    Daily sequence · timing can remain unconfirmed
                  </p>
                  <ol>
                    {links.map((l, i) => (
                      <li key={l.shotId}>
                        <Link to={`/shotlists/${l.listId}?shot=${l.shotId}`}>
                          {String(
                            selectedShots[l.shotId]?.number ||
                              'Shot ' + (i + 1),
                          )}{' '}
                          · {String(selectedShots[l.shotId]?.subject || '')}
                          <small>
                            {[
                              selectedShots[l.shotId]?.coverage,
                              selectedShots[l.shotId]?.camera,
                              selectedShots[l.shotId]?.framing,
                              selectedShots[l.shotId]?.lens,
                              selectedShots[l.shotId]?.estimatedMinutes
                                ? selectedShots[l.shotId].estimatedMinutes +
                                  ' min'
                                : 'Duration unknown',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </small>
                        </Link>
                        <Button
                          icon="up"
                          aria-label={`Move shot ${i + 1} up`}
                          disabled={!i}
                          onClick={() =>
                            setLinks((v) => {
                              const n = [...v]
                              ;[n[i - 1], n[i]] = [n[i], n[i - 1]]
                              return n
                            })
                          }
                        >
                          Up
                        </Button>
                        <Button
                          icon="trash"
                          onClick={() =>
                            setLinks((v) =>
                              v.filter((x) => x.shotId !== l.shotId),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </section>
          )}
          {workflow === 'previous' && (
            <Menu
              label={
                items.find((i) => i.id === previous)?.name ||
                'Choose previous Flow'
              }
              value={previous}
              onChange={setPrevious}
              items={items.map((i) => ({ value: i.id, label: i.name }))}
            />
          )}
          {workflow === 'import' && (
            <p className="flow-muted">
              Review the workbook and map its time columns before adding events.
            </p>
          )}
          {error && <ErrorNotice>{error}</ErrorNotice>}
        </Overlay>
      )}
      {picker && (
        <ShotPicker
          flowContext
          initial={links}
          onClose={() => setPicker(false)}
          onConfirm={(l) => {
            setLinks(l)
            if (l[0])
              void shotRequest<{
                shots: Record<string, Record<string, unknown>>
              }>(`/${l[0].listId}/export`)
                .then((r) => setSelectedShots(r.shots))
                .catch((e) => setError(e.message))
            setPicker(false)
          }}
        />
      )}
      {rename && (
        <Overlay
          title="Rename Flow"
          onClose={() => setRename(undefined)}
          footer={
            <Button
              variant="primary"
              onClick={() => void manage(rename.id, 'rename', name)}
            >
              Save
            </Button>
          }
        >
          <label className="flow-field">
            Title
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={180}
            />
          </label>
        </Overlay>
      )}
      {remove && (
        <Overlay
          title={`Delete ${remove.name}?`}
          onClose={() => setRemove(undefined)}
          footer={
            <Button
              variant="danger"
              state={pending ? 'pending' : 'idle'}
              onClick={() => void manage(remove.id, 'archive')}
            >
              Delete Flow
            </Button>
          }
        >
          <p>
            The Flow can be restored. Its connected Shot List remains unchanged.
          </p>
        </Overlay>
      )}
    </div>
  )
}

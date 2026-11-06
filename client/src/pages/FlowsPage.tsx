import {EmptyState} from '../components/whiteout/Feedback'
import CreationChoices from '../components/whiteout/CreationChoices'
import DatePicker from '../components/whiteout/DatePicker'
import SelectedShots from '../components/flow/SelectedShots'
import { sourceLabel } from '../../../server/src/flows/scheduling'
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
    [dateValid, setDateValid] = useState(true),
    [workflow, setWorkflow] = useState('shots'),
    [links, setLinks] = useState<ShotLink[]>([]),
    [selectedShots, setSelectedShots] = useState<
      Record<string, Record<string, unknown>>
    >({}),
    [picker, setPicker] = useState(false),
    [pending, setPending] = useState(false),
    [remove, setRemove] = useState<Item>(),
    [copy, setCopy] = useState<Item>(),
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
        ...(action === 'duplicate' ? { date } : {}),
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
      setCopy(undefined)
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
      const r = await flowRequest<{ id: string }>('', {
        id: request.current,
        name,
        date,
        clockVersion: 2,
        departmentTemplate: workflow === 'import' ? 'import' : 'standard',
        ...(workflow === 'shots'
          ? {
              listId: links[0]?.listId,
              shotIds: links.map((l) => l.shotId),
            }
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
        ? b.updatedAt.localeCompare(a.updatedAt) ||
          a.id.localeCompare(b.id)
        : (a.date || '9999').localeCompare(b.date || '9999') ||
          a.name.localeCompare(b.name) ||
          a.id.localeCompare(b.id),
    )
  return (
    <div className="pd-page flow-index">
      <PageHeader title="Flow of the Day" />
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
                <th>Shoot date</th>
                <th>Events</th>
                <th>Last updated</th>
                <th>
                  <span className="pd-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <DocumentRow key={i.id} to={`/flows/${i.id}`}>
                  <td>
                    <div className="pd-document-title">
                      <Link
                        className="pd-document-link"
                        to={`/flows/${i.id}`}
                      >
                        {i.name}
                      </Link>
                      {i.listId && (
                        <small>
                          {i.listName || 'Shot List unavailable'}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>{i.date || 'Unscheduled'}</td>
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
                          onSelect: () => {
                            setName(i.name + ' — Copy')
                            setDate('')
                            setCopy(i)
                          },
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
            <EmptyState kind="search" title="No matching production days"/>
          )}
        </div>
      ) : (
        <EmptyState icon="calendar" title="No production days yet" action={<Button variant="primary" icon="plus" onClick={()=>navigate('/flows/new')}>Create Flow of the Day</Button>}/>
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
              disabled={
                !dateValid ||
                !name.trim() ||
                (workflow === 'shots' && !links.length)
              }
            >
              Create Flow
            </Button>
          }
        >
          <CreationChoices
            value={workflow}
            onChange={setWorkflow}
            choices={[
              {
                id: 'shots',
                icon: 'shots',
                label: 'From Shot List',
                description: 'Plan with your production shots',
              },
              {
                id: 'import',
                icon: 'import',
                label: 'Import Excel',
                description: 'Bring an existing schedule',
              },
              {
                id: 'blank',
                icon: 'file',
                label: 'Start blank',
                description: 'Build the day as you go',
              },
            ]}
          />
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
            <DatePicker
              onValidityChange={setDateValid}
              label="Shoot date"
              value={date}
              onChange={setDate}
            />
          </div>
          {workflow === 'shots' && (
            <section className="flow-creation-shots">
              <Button icon="shots" onClick={() => setPicker(true)}>
                {links.length
                  ? `${links.length} shots selected`
                  : 'Choose Shot List and shots'}
              </Button>
              {links.length > 0 && (
                <SelectedShots
                  links={links}
                  data={selectedShots}
                  onChange={setLinks}
                />
              )}
            </section>
          )}
          {workflow === 'import' && (
            <p className="flow-muted">
              Review the workbook and map its time columns before adding
              events.
            </p>
          )}
          {error && <ErrorNotice>{error}</ErrorNotice>}
        </Overlay>
      )}
      {picker && (
        <ShotPicker
          flowContext
          preselectAvailable={links.length === 0}
          initial={links}
          onClose={() => setPicker(false)}
          onConfirm={(l) => {
            setLinks(l)
            if (l[0])
              void shotRequest<{
                shots: Record<string, Record<string, unknown>>
                scenes: Record<string, Record<string, unknown>>
              }>(`/${l[0].listId}/export`)
                .then((r) =>
                  setSelectedShots(
                    Object.fromEntries(
                      Object.entries(r.shots).map(([id, shot]) => [
                        id,
                        { ...shot, number: sourceLabel(shot, r) },
                      ]),
                    ),
                  ),
                )
                .catch((e) => setError(e.message))
            setPicker(false)
          }}
        />
      )}
      {copy && (
        <Overlay
          title="Duplicate Flow"
          onClose={() => setCopy(undefined)}
          footer={
            <Button
              variant="primary"
              disabled={!dateValid || !name.trim() || pending}
              onClick={() => void manage(copy.id, 'duplicate', name)}
            >
              Create copy
            </Button>
          }
        >
          <div className="flow-form">
            <label>
              Title
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={180}
              />
            </label>
            <DatePicker
              onValidityChange={setDateValid}
              label="Shoot date"
              value={date}
              onChange={setDate}
            />
          </div>
        </Overlay>
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
            The Flow can be restored. Its connected Shot List remains
            unchanged.
          </p>
        </Overlay>
      )}
    </div>
  )
}

import CreationChoices from '../components/whiteout/CreationChoices'
import { StoryboardIllustration } from '../components/storyboards/StoryboardIdentity'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageHeader, SearchField } from '../components/whiteout/Workspace'
import { Button } from '../components/whiteout/Button'
import Menu from '../components/whiteout/Menu'
import DocumentRow from '../components/whiteout/DocumentRow'
import { Overlay } from '../components/whiteout/Overlay'
import {
  EmptyState,
  ErrorNotice,
  LoadingRows,
  SessionState,
  useToast,
} from '../components/whiteout/Feedback'
import { getAuthToken } from '../lib/api'
import { boardRequest } from '../lib/storyboards/api'
import Artwork from '../components/storyboards/Artwork'
import ShotPicker from '../components/storyboards/ShotPicker'
import type { ShotLink } from '../lib/storyboards/model'
import '../components/storyboards/storyboards.css'
type Board = {
  id: string
  name: string
  linkedListNames?: string[]
  sceneLabels?: string[]
  panelCount: number
  updatedAt: string
  originatingList?: string
  previewAsset?: string
  previewHeight?: number
  previewFrame?: import('../lib/storyboards/framing').ArtworkFrame
  previewDrawing?: import('../lib/storyboards/model').Annotation[]
}
export default function StoryboardsPage() {
  const navigate = useNavigate(),
    location = useLocation(),
    notify = useToast(),
    requestId = useRef(crypto.randomUUID())
  const [items, setItems] = useState<Board[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [sort, setSort] = useState('modified'),
    [refresh, setRefresh] = useState(0)
  const [name, setName] = useState(''),
    [workflow, setWorkflow] = useState('import'),
    [pending, setPending] = useState(false),
    [picker, setPicker] = useState(false),
    [links, setLinks] = useState<ShotLink[]>([]),
    [rename, setRename] = useState<Board>(),
    [remove, setRemove] = useState<Board>()
  const creating = location.pathname.endsWith('/new')
  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false)
      return
    }
    let alive = true
    boardRequest<{ items: Board[] }>('')
      .then((r) => alive && setItems(r.items))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [refresh])
  if (!getAuthToken() || error === 'UNAUTHORIZED') return <SessionState />
  async function action(id: string, action: string, title?: string) {
    setPending(true)
    setError('')
    try {
      const result = await boardRequest<{ id: string }>(`/${id}/manage`, {
        action,
        name: title,
      })
      if (action === 'archive')
        notify('Storyboard deleted.', {
          action: {
            label: 'Restore',
            run: () => {
              void boardRequest(`/${id}/manage`, { action: 'restore' })
                .then(() => setRefresh((n) => n + 1))
                .catch((e) => notify(e.message, { state: 'error' }))
            },
          },
        })
      if (action === 'duplicate') navigate(`/storyboards/${result.id}`)
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
    if (!name.trim()) return
    setPending(true)
    setError('')
    try {
      const board = await boardRequest<{ id: string }>('', {
        id: requestId.current,
        name: name.trim(),
        ...(workflow === 'shots'
          ? {
              listId: links[0]?.listId,
              shotIds: links.map((l) => l.shotId),
            }
          : {}),
      })
      navigate(
        `/storyboards/${board.id}${
          workflow === 'import'
            ? '?import=1'
            : workflow === 'blank'
            ? '?draw=1'
            : ''
        }`,
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }
  const filtered = items
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === 'title'
        ? a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
        : Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
          a.id.localeCompare(b.id),
    )
  return (
    <div className="pd-page">
      <PageHeader title="Storyboards" />
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="pd-toolbar">
        <SearchField
          label="Search storyboards"
          placeholder="Search storyboards..."
          value={search}
          onChange={setSearch}
        />
        <Menu
          label={sort === 'title' ? 'Title A–Z' : 'Last modified'}
          icon="sort"
          value={sort}
          onChange={setSort}
          items={[
            { value: 'modified', label: 'Last modified' },
            { value: 'title', label: 'Title A–Z' },
          ]}
        />
      </div>
      {loading ? (
        <LoadingRows label="Loading storyboards…" />
      ) : items.length ? (
        <div className="pd-table-wrap">
          <table
            className="pd-table pd-documents"
            aria-label="Production storyboards"
          >
            <thead>
              <tr>
                <th>Document</th>
                <th>Shot List / scenes</th>
                <th>Panels</th>
                <th>Last modified</th>
                <th>
                  <span className="pd-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <DocumentRow key={b.id} to={`/storyboards/${b.id}`}>
                  <td className="pd-document-title">
                    <div className="sb-document-identity">
                      {(b.previewAsset || b.previewDrawing) && (
                        <div className="sb-index-thumb">
                          <Artwork
                            documentId={b.id}
                            assetId={b.previewAsset}
                            drawing={b.previewDrawing}
                            drawingHeight={b.previewHeight}
                            frame={b.previewFrame}
                            label={b.name}
                          />
                        </div>
                      )}
                      <Link
                        className="pd-document-link"
                        to={`/storyboards/${b.id}`}
                      >
                        {b.name}
                      </Link>
                    </div>
                  </td>
                  <td>
                    {b.linkedListNames?.join(' · ') || '—'}
                    {b.sceneLabels?.length ? (
                      <small className="sb-index-scenes">
                        Scene {b.sceneLabels.join(', ')}
                      </small>
                    ) : null}
                  </td>
                  <td>{b.panelCount}</td>
                  <td>{new Date(b.updatedAt).toLocaleDateString()}</td>
                  <td className="pd-row-actions">
                    <Menu
                      compact
                      label={`Actions for ${b.name}`}
                      items={[
                        {
                          value: 'open',
                          label: 'Open',
                          onSelect: () => navigate(`/storyboards/${b.id}`),
                        },
                        {
                          value: 'rename',
                          label: 'Rename',
                          onSelect: () => {
                            setName(b.name)
                            setRename(b)
                          },
                        },
                        {
                          value: 'duplicate',
                          label: 'Duplicate',
                          onSelect: () => void action(b.id, 'duplicate'),
                        },
                        {
                          value: 'delete',
                          label: 'Delete',
                          danger: true,
                          onSelect: () => setRemove(b),
                        },
                      ]}
                    />
                  </td>
                </DocumentRow>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <EmptyState kind="search" title="No matching storyboards" />
          )}
        </div>
      ) : (
        <EmptyState icon="grid" title="No storyboards yet" action={<Button variant="primary" icon="plus" onClick={()=>navigate('/storyboards/new')}>Create storyboard</Button>}/>
      )}
      {(creating || rename) && (
        <Overlay
          title={rename ? 'Rename storyboard' : 'New storyboard'}
          onClose={() =>
            rename ? setRename(undefined) : navigate('/storyboards')
          }
          busy={pending}
          footer={
            <>
              <Button
                onClick={() =>
                  rename ? setRename(undefined) : navigate('/storyboards')
                }
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                state={pending ? 'pending' : 'idle'}
                disabled={
                  !name.trim() ||
                  (creating && workflow === 'shots' && !links.length)
                }
                onClick={() =>
                  rename
                    ? void action(rename.id, 'rename', name)
                    : void create()
                }
              >
                {rename ? 'Save' : 'Create storyboard'}
              </Button>
            </>
          }
        >
          <label className="pd-field">
            Title
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={180}
            />
          </label>
          {creating && (
            <div className="sb-creation-options">
              <CreationChoices
                value={workflow}
                onChange={setWorkflow}
                choices={[
                  {
                    id: 'import',
                    label: 'Import artwork',
                    icon: 'import',
                  },
                  { id: 'shots', label: 'From Shot List', icon: 'shots' },
                  { id: 'blank', label: 'Start drawing', icon: 'edit' },
                ]}
              />
              {workflow === 'shots' && (
                <Button onClick={() => setPicker(true)}>
                  Choose shots{links.length ? ` · ${links.length}` : ''}
                </Button>
              )}
            </div>
          )}
          {error && <p role="alert">{error}</p>}
        </Overlay>
      )}
      {picker && (
        <ShotPicker
          initial={links}
          onClose={() => setPicker(false)}
          onConfirm={(l) => {
            if (new Set(l.map((x) => x.listId)).size > 1) {
              setError('Choose shots from one originating Shot List.')
              return
            }
            setLinks(l)
            setPicker(false)
          }}
        />
      )}
      {remove && (
        <Overlay
          title={`Delete “${remove.name}”?`}
          onClose={() => setRemove(undefined)}
          busy={pending}
          footer={
            <>
              <Button onClick={() => setRemove(undefined)}>Cancel</Button>
              <Button
                variant="danger"
                state={pending ? 'pending' : 'idle'}
                onClick={() => void action(remove.id, 'archive')}
              >
                Delete storyboard
              </Button>
            </>
          }
        >
          <p>
            You can restore this storyboard from the notification. Linked
            shots stay in place.
          </p>
        </Overlay>
      )}
    </div>
  )
}

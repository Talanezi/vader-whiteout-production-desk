import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as Y from 'yjs'
import { useShotCollaboration } from '../../lib/useShotCollaboration'
import { ordered, shots, scenes, str, fields } from '../../lib/shotDocument'
import CollaborativeText from '../shots/CollaborativeText'
import { SearchField } from '../whiteout/Workspace'
import { LoadingRows, ErrorNotice } from '../whiteout/Feedback'
import Icon from '../whiteout/Icon'
/** A compact presentation of the authoritative M03 document. Coverage uses the
 * existing M03 collaborative editor; technical values are never copied. */
export default function ShotPane({
  listId,
  selected,
  onSelect,
}: {
  listId: string
  selected: string[]
  onSelect: (id: string) => void
}) {
  const c = useShotCollaboration(listId),
    [search, setSearch] = useState(''),
    [expanded, setExpanded] = useState('')
  if (!c.synced)
    return c.error ? (
      <ErrorNotice>{c.error}</ErrorNotice>
    ) : (
      <LoadingRows label="Loading shots…" />
    )
  const rows = ordered(shots(c.doc))
    .filter((s) =>
      [str(s, 'number'), str(s, 'coverage')]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(scenes(c.doc).get(str(a, 'sceneId'))?.get('order') || 0) -
          Number(scenes(c.doc).get(str(b, 'sceneId'))?.get('order') || 0) ||
        Number(a.get('order')) - Number(b.get('order')),
    )
  return (
    <section className="sb-shot-pane" aria-label="Linked Shot List">
      <div className="sb-shot-pane-heading">
        <Link to={`/shotlists/${listId}`}>
          {String(c.doc.getMap('meta').get('name') || 'Shot List')}
          <Icon name="arrow" />
        </Link>
        {!c.saved && (
          <span role="status">
            {c.connected ? 'Syncing…' : 'Reconnecting…'}
          </span>
        )}
      </div>
      {c.error && <ErrorNotice>{c.error}</ErrorNotice>}
      <SearchField
        label="Search linked shots"
        placeholder="Search shots..."
        value={search}
        onChange={setSearch}
      />
      <div className="sb-shot-pane-scroll">
        <table aria-label="Storyboard technical shots">
          <thead>
            <tr>
              <th>Shot</th>
              <th>Action / coverage</th>
              <th>
                <span className="pd-sr-only">Technical details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const id = str(s, 'id'),
                text = s.get('coverage')
              return (
                <tr
                  key={id}
                  data-shot={id}
                  className={selected.includes(id) ? 'is-selected' : ''}
                  onClick={() => onSelect(id)}
                >
                  <td>
                    <button
                      className="sb-shot-select"
                      onClick={() => onSelect(id)}
                      aria-pressed={selected.includes(id)}
                    >
                      {str(s, 'number')}
                      <small>
                        Scene{' '}
                        {str(scenes(c.doc).get(str(s, 'sceneId')), 'number')}
                      </small>
                      <span className="pd-sr-only"> · {id.slice(0, 8)}</span>
                    </button>
                  </td>
                  <td>
                    {text instanceof Y.Text && c.provider ? (
                      <CollaborativeText
                        text={text}
                        provider={c.provider}
                        undo={c.undo}
                        compact
                        label={`Coverage ${str(s, 'number')}`}
                        onFocus={() => onSelect(id)}
                      />
                    ) : (
                      <span>{str(s, 'coverage')}</span>
                    )}
                    <small className="sb-shot-tech-summary">
                      {['camera', 'framing', 'lens']
                        .map((k) => String(s.get(k) || ''))
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                    {expanded === id && (
                      <dl>
                        {(
                          [
                            'angle',
                            'equipment',
                            'movement',
                            'notes',
                            'focusNotes',
                            'lightingNotes',
                          ] as const
                        )
                          .filter((k) => str(s, k))
                          .map((k) => (
                            <div key={k}>
                              <dt>{fields[k]}</dt>
                              <dd>{str(s, k)}</dd>
                            </div>
                          ))}
                        <Link
                          to={`/shotlists/${listId}?shot=${id}&scene=${str(s, 'sceneId')}`}
                        >
                          Open shot editor
                        </Link>
                      </dl>
                    )}
                  </td>
                  <td>
                    <button
                      className="sb-shot-details"
                      aria-label={`Details for ${str(s, 'number')}`}
                      aria-expanded={expanded === id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpanded(expanded === id ? '' : id)
                      }}
                    >
                      <Icon name="more" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

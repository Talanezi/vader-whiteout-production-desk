import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import { put, values } from '../../lib/storyboards/model'
import { Button } from '../whiteout/Button'
import { StudioIcon, StudioGlyph } from './StudioControls'
type Comment = {
  id: string
  panelId: string
  author: string
  authorId: number
  createdAt: string
  text: string
  parentId?: string
  resolved?: boolean
}
export default function PanelDiscussion({
  doc,
  panelId,
  user,
}: {
  doc: Y.Doc
  panelId: string
  user: { id: number; name: string }
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({}),
    [reply, setReply] = useState(''),
    [resolved, setResolved] = useState(false),
    composer = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (reply) composer.current?.focus()
  }, [reply])
  useEffect(() => {
    setReply('')
    setDrafts({})
  }, [panelId])
  const all = values<Comment>(doc, 'comments')
    .filter((c) => c.panelId === panelId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  function post(parent = '') {
    const text = (drafts[parent] || '').trim()
    if (!text) return
    const id = crypto.randomUUID()
    put(doc, 'comments', id, {
      id,
      panelId,
      author: user.name,
      authorId: user.id,
      text: text.slice(0, 8000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(parent ? { parentId: parent } : {}),
    })
    setDrafts((v) => ({ ...v, [parent]: '' }))
    setReply('')
  }
  const form = (parent = '') => (
    <form
      className="sb-comment-composer"
      onSubmit={(e) => {
        e.preventDefault()
        post(parent)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && parent) {
          e.preventDefault()
          e.stopPropagation()
          setReply('')
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault()
          post(parent)
        }
      }}
    >
      <textarea
        ref={parent ? composer : undefined}
        aria-label={parent ? 'Reply' : 'Add comment'}
        placeholder={parent ? 'Write a reply…' : 'Add a comment…'}
        value={drafts[parent] || ''}
        maxLength={8000}
        rows={2}
        onChange={(e) => setDrafts((v) => ({ ...v, [parent]: e.target.value }))}
      />
      <div>
        {parent && (
          <StudioIcon
            name="close"
            label="Cancel reply"
            onClick={() => setReply('')}
          />
        )}
        <button
          className="sb-comment-send"
          aria-label={parent ? 'Send reply' : 'Post comment'}
          type="submit"
          disabled={!(drafts[parent] || '').trim()}
        >
          <StudioGlyph name="send" />
        </button>
      </div>
    </form>
  )
  const author = (c: Comment) => (
    <header>
      <span className="sb-comment-avatar" aria-hidden="true">
        {c.author
          .split(' ')
          .map((s) => s[0])
          .slice(0, 2)
          .join('')}
      </span>
      <span>
        <strong>{c.author}</strong>
        <time dateTime={c.createdAt}>
          {new Date(c.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </span>
    </header>
  )
  return (
    <section className="sb-discussion">
      <div className="sb-discussion-heading">
        <h3>Comments</h3>
        <Button variant="quiet" onClick={() => setResolved((v) => !v)}>
          {resolved ? 'Hide resolved' : 'View resolved'}
        </Button>
      </div>
      {all
        .filter((c) => !c.parentId && (resolved || !c.resolved))
        .map((c) => (
          <article key={c.id} className={c.resolved ? 'is-resolved' : ''}>
            {author(c)}
            <p>{c.text}</p>
            <div className="sb-thread-actions">
              <StudioIcon
                name="reply"
                label="Reply"
                active={reply === c.id}
                onClick={() => setReply(reply === c.id ? '' : c.id)}
              />
              <StudioIcon
                name={c.resolved ? 'undo' : 'check'}
                label={c.resolved ? 'Reopen' : 'Resolve'}
                onClick={() =>
                  put(doc, 'comments', c.id, {
                    resolved: !c.resolved,
                    updatedAt: new Date().toISOString(),
                  })
                }
              />
              {c.resolved && <small>Resolved</small>}
            </div>
            {all
              .filter((r) => r.parentId === c.id)
              .map((r) => (
                <div className="sb-thread-reply" key={r.id}>
                  {author(r)}
                  <p>{r.text}</p>
                </div>
              ))}
            {reply === c.id && form(c.id)}
          </article>
        ))}
      {!all.some((c) => !c.parentId && (resolved || !c.resolved)) && (
        <p className="sb-comment-empty">No open comments.</p>
      )}
      {form()}
    </section>
  )
}

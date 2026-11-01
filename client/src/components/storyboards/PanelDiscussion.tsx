import { useState } from 'react'
import type * as Y from 'yjs'
import { put, values } from '../../lib/storyboards/model'
import { Button } from '../whiteout/Button'
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
  const [text, setText] = useState(''),
    [reply, setReply] = useState(''),
    [resolved, setResolved] = useState(false)
  const all = values<Comment>(doc, 'comments')
    .filter((c) => c.panelId === panelId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  function add() {
    if (!text.trim()) return
    const id = crypto.randomUUID()
    put(doc, 'comments', id, {
      id,
      panelId,
      author: user.name,
      authorId: user.id,
      text: text.trim().slice(0, 8000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(reply ? { parentId: reply } : {}),
    })
    setText('')
    setReply('')
  }
  return (
    <section className="sb-discussion">
      <h3>Comments</h3>
      <Button variant="quiet" onClick={() => setResolved((v) => !v)}>
        {resolved ? 'Hide resolved' : 'View resolved'}
      </Button>
      {all
        .filter((c) => !c.parentId && (resolved || !c.resolved))
        .map((c) => (
          <article key={c.id}>
            <strong>{c.author}</strong>
            <time>{new Date(c.createdAt).toLocaleString()}</time>
            <p>{c.text}</p>
            <Button variant="quiet" onClick={() => setReply(c.id)}>
              Reply
            </Button>
            <Button
              variant="quiet"
              onClick={() =>
                put(doc, 'comments', c.id, {
                  resolved: !c.resolved,
                  updatedAt: new Date().toISOString(),
                })
              }
            >
              {c.resolved ? 'Reopen' : 'Resolve'}
            </Button>
            {all
              .filter((r) => r.parentId === c.id)
              .map((r) => (
                <blockquote key={r.id}>
                  <strong>{r.author}</strong>
                  <p>{r.text}</p>
                </blockquote>
              ))}
          </article>
        ))}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        {reply && <Button onClick={() => setReply('')}>Cancel reply</Button>}
        <textarea
          aria-label={reply ? 'Reply' : 'Add comment'}
          value={text}
          maxLength={8000}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" disabled={!text.trim()}>
          {reply ? 'Reply' : 'Comment'}
        </Button>
      </form>
    </section>
  )
}

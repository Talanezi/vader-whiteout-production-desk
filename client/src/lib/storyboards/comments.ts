import type * as Y from 'yjs'
import { values } from './model'

type DiscussionComment = {
  id: string
  panelId: string
  parentId?: string
  resolved?: boolean
}

/** Count the messages visible in unresolved threads, including their replies.
 * Resolving a thread removes its whole discussion from the active count. */
export function activeCommentCounts(doc: Y.Doc) {
  const comments = values<DiscussionComment>(doc, 'comments')
  const roots = new Map(
    comments.filter((c) => !c.parentId && !c.resolved).map((c) => [c.id, c]),
  )
  const counts = new Map<string, number>()
  for (const comment of comments) {
    const root = roots.get(comment.parentId || comment.id)
    if (root && root.panelId === comment.panelId)
      counts.set(comment.panelId, (counts.get(comment.panelId) || 0) + 1)
  }
  return counts
}

import type { Panel } from './model'
import type { LinkedSnapshot } from '../../components/storyboards/ShotPicker'
/** Derived, never persisted over a custom title, source label or permanent UUID. */
export function panelIdentity(
  panel: Panel,
  index: number,
  snapshots: Record<string, LinkedSnapshot>,
) {
  if (panel.title?.trim()) return panel.title.trim()
  const labels = panel.links
    .map((l) => snapshots[l.listId]?.shots[l.shotId])
    .filter(
      (s) => s && !s.deleted && !s.deletedAt && String(s.number || '').trim(),
    )
    .map((s) => String(s.number))
  if (labels.length)
    return labels[0] + (labels.length > 1 ? ` +${labels.length - 1}` : '')
  return panel.label?.trim() && !/^Panel\s+\d+$/i.test(panel.label)
    ? panel.label
    : `Panel ${index + 1}`
}

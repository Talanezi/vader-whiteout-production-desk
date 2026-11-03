import { sourceLabel } from '../../../../server/src/flows/scheduling'
import type { Panel } from './model'
import type { LinkedSnapshot } from '../../components/storyboards/ShotPicker'
/** Matches accepted M03 displayShot semantics; this is a derived read-only label. */
export function linkedShotLabel(
  snapshot: LinkedSnapshot | undefined,
  id: string,
) {
  const shot = snapshot?.shots[id]
  if (!shot || shot.deleted || shot.deletedAt) return ''
  return sourceLabel(shot, snapshot)
}
/** Derived, never persisted over a custom title, source label or permanent UUID. */
export function panelIdentity(
  panel: Panel,
  index: number,
  snapshots: Record<string, LinkedSnapshot>,
) {
  if (panel.title?.trim()) return panel.title.trim()
  const labels = panel.links
    .map((l) => linkedShotLabel(snapshots[l.listId], l.shotId))
    .filter(Boolean)
  if (labels.length)
    return (
      labels[0] +
      (panel.links.length > 1 ? ` +${panel.links.length - 1}` : '')
    )
  return panel.label?.trim() && !/^Panel\s+\d+$/i.test(panel.label)
    ? panel.label
    : `Panel ${index + 1}`
}

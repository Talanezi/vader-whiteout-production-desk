import * as Y from 'yjs';
export type ReportRecord = Record<string, unknown>;
export type ShotSnapshot = {
  meta: ReportRecord;
  scenes: Record<string, ReportRecord>;
  shots: Record<string, ReportRecord>;
  shootDays: Record<string, ReportRecord>;
  shootAssignments: Record<string, ReportRecord>;
};
export type PrintOptions = {
  mode?: 'creative' | 'shooting' | 'both';
  paper?: 'letter' | 'a4';
  profile?: 'compact' | 'standard' | 'detailed';
  notes?: boolean;
  summaries?: boolean;
  sceneIds?: string[];
  dayIds?: string[];
  orderIds?: string[];
};
export function snapshot(doc: Y.Doc): ShotSnapshot {
  return Object.fromEntries(
    ['meta', 'scenes', 'shots', 'shootDays', 'shootAssignments'].map((k) => [
      k,
      doc.getMap(k).toJSON(),
    ]),
  ) as ShotSnapshot;
}
const sorted = (records: Record<string, ReportRecord>) =>
  Object.values(records)
    .filter((r) => !r.deleted)
    .sort(
      (a, b) =>
        (Number(a.order) || 0) - (Number(b.order) || 0) ||
        String(a.id).localeCompare(String(b.id)),
    );
const text = (r: ReportRecord, k: string) => String(r?.[k] ?? '');
export function metadata(data: ShotSnapshot) {
  const scenes = sorted(data.scenes),
    sceneIds = new Set(scenes.map((s) => s.id)),
    shots = sorted(data.shots).filter((s) => sceneIds.has(s.sceneId)),
    shotIds = new Set(shots.map((s) => s.id)),
    days = sorted(data.shootDays),
    dayIds = new Set(days.map((d) => d.id)),
    assigned = sorted(data.shootAssignments).filter(
      (a) => shotIds.has(a.shotId) && dayIds.has(a.dayId),
    ),
    dates = [
      ...new Set(
        assigned
          .map((a) => text(data.shootDays[String(a.dayId)], 'date'))
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
      ),
    ].sort();
  return {
    sceneCount: scenes.length,
    shotCount: shots.length,
    scheduledShotCount: new Set(assigned.map((a) => a.shotId)).size,
    dates,
  };
}

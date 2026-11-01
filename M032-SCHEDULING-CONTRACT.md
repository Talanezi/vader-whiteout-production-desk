# Additive scheduling contract for future M05

M03.2 stores schedules inside the existing authoritative Yjs document. Master `shots` and `scenes` retain their UUIDs, text labels, narrative fields, `order` and `planningOrder`. No duplicated master shot is created by assigning or printing a day.

`shootDays`: UUID-keyed Y.Map records with `id`, valid date-only `YYYY-MM-DD`, `title`, `notes`, numeric `order`, optional `deleted`.

`shootAssignments`: UUID-keyed Y.Map records with `id`, `dayId`, `shotId`, numeric `order`, `notes`, `status`, optional string `estimatedMinutes` override, `pickup` and optional `deleted`. References to deleted days/shots are excluded from usable assignments. Multiple intentional assignments of one master are allowed for pickups. Assignment order is separate from both creative order fields.

`assignmentContract(doc, dayId)` in `client/src/lib/shotSchedule.ts` resolves live references in stable order into:

```ts
{
  assignmentId, shootDayId, shotId, sceneId, number, coverage, camera,
  technical: { framing, angle, lens, movement, equipment },
  estimatedMinutes, // override, otherwise master estimate
  notes, order
}
```

Consumers must use UUIDs as identity, never displayed shot numbers or the day's 1-based sequence. Scene number/shot label changes are presentation updates. `metadata` and authenticated JSON export expose saved date ranges, maps and counts. The PDF's version-2 spec uses `{shotId, assignmentId?}` references for the same reason.

All edits continue through the existing authenticated collaboration layer and save acknowledgements. M05 should consume this contract without renumbering masters or conflating schedule and creative ordering. This document does not add any Flow of the Day routes, migrations or behavior.

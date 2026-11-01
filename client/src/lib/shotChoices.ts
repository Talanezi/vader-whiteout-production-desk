import * as Y from 'yjs'
import { choices, shots, str, type ShotField } from './shotDocument'
export const choiceFields: ShotField[] = [
  'subject',
  'camera',
  'framing',
  'angle',
  'lens',
  'equipment',
  'movement',
]
export const choiceKey = (value: string) =>
  value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
const key = (field: ShotField, value: string) => field + ':' + choiceKey(value)
type Entry = { value: string; hidden: boolean }
export function documentChoices(doc: Y.Doc, field: ShotField) {
  const entries = doc.getMap<Entry>('choiceOptions'),
    merged = new Map<string, string>()
  for (const value of [
    ...(choices[field] || []),
    ...[...shots(doc).values()]
      .filter((s) => !s.get('deleted'))
      .map((s) => str(s, field)),
  ]) {
    if (choiceKey(value)) merged.set(choiceKey(value), value)
  }
  for (const [entryKey, entry] of entries)
    if (
      entryKey.startsWith(field + ':') &&
      entry &&
      typeof entry.value === 'string'
    ) {
      if (entry.hidden) merged.delete(choiceKey(entry.value))
      else merged.set(choiceKey(entry.value), entry.value)
    }
  // Built-ins remain available and cannot be renamed/removed by choice management.
  for (const value of choices[field] || []) merged.set(choiceKey(value), value)
  return [...merged.values()]
}
export function builtInChoice(field: ShotField, value: string) {
  return (choices[field] || []).some((v) => choiceKey(v) === choiceKey(value))
}
export function updateDocumentChoice(
  doc: Y.Doc,
  field: ShotField,
  value: string,
  previous?: string,
) {
  if (!choiceFields.includes(field))
    throw Error('This field does not support choices.')
  const next = value.trim().replace(/\s+/g, ' ')
  if (!next || next.length > 160)
    throw Error('Enter a choice of 1–160 characters.')
  if (previous && builtInChoice(field, previous))
    throw Error('Built-in choices are preserved.')
  if (
    documentChoices(doc, field).some(
      (v) =>
        choiceKey(v) === choiceKey(next) &&
        choiceKey(v) !== choiceKey(previous || ''),
    )
  )
    throw Error('This choice already exists.')
  doc.transact(() => {
    const entries = doc.getMap<Entry>('choiceOptions')
    if (previous && choiceKey(previous) !== choiceKey(next))
      entries.set(key(field, previous), { value: previous, hidden: true })
    entries.set(key(field, next), { value: next, hidden: false })
  }, 'local')
}
export function removeDocumentChoice(
  doc: Y.Doc,
  field: ShotField,
  value: string,
) {
  if (builtInChoice(field, value))
    throw Error('Built-in choices are preserved.')
  doc.transact(
    () =>
      doc
        .getMap<Entry>('choiceOptions')
        .set(key(field, value), { value, hidden: true }),
    'local',
  )
}

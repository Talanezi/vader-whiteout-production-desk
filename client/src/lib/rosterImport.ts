import type { RosterCategory, RosterPerson } from '../data/mockCallSheet'
export type RosterForm = Omit<RosterPerson, 'id'>
export const emptyRosterForm: RosterForm = {
  name: '',
  category: 'other',
  roleOrDepartment: '',
  email: '',
  phone: '',
  notes: '',
  active: true,
}
export function normalizeCategory(value: string): RosterCategory {
  const normalized = value.trim().toLowerCase()
  if (['cast', 'actor', 'actress'].includes(normalized)) return 'cast'
  if (normalized === 'crew') return 'crew'
  if (['emergency', 'contact', 'emergency contact'].includes(normalized))
    return 'emergency'
  return 'other'
}
// Preserve the existing simple delimiter parser. Quoted CSV is not supported.
export function parseRosterLines(
  text: string,
): { source: string; person: RosterForm }[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((source) => {
      const [
        name = '',
        category = '',
        roleOrDepartment = '',
        email = '',
        phone = '',
        notes = '',
      ] = source
        .split(source.includes('|') ? '|' : ',')
        .map((part) => part.trim())
      return {
        source,
        person: {
          name,
          category: normalizeCategory(category),
          roleOrDepartment,
          email,
          phone,
          notes,
          active: true,
        },
      }
    })
    .filter((row) => row.person.name)
}

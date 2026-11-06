export type CastPerson = {
  id: string;
  name: string;
  roleOrDepartment: string;
};
const normalize = (v: unknown) =>
  String(v || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
/** Only production-managed Cast records may be inferred. Unrecognized subjects remain unassociated. */
export function linkedTalent(
  event: any,
  shot: any,
  cast: CastPerson[] = [],
) {
  if (Array.isArray(event.talentIds))
    return cast.filter((p) => event.talentIds.includes(p.id));
  const subjects = String(shot?.subject || '')
    .split(/[,;/&+]|\band\b/i)
    .map(normalize)
    .filter(Boolean);
  return cast.filter((p) =>
    subjects.some((s) =>
      [normalize(p.name), normalize(p.roleOrDepartment)].some(
        (v) => v === s || (s.length >= 3 && v.split(' ').includes(s)),
      ),
    ),
  );
}

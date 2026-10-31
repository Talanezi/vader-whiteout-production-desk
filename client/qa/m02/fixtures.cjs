const fs = require('fs')
// Isolated QA data only. No fixtures are imported by the actual application.
const src = fs.readFileSync(
  require('path').join(__dirname, '../../src/data/mockCallSheet.ts'),
  'utf8',
)
const expression = src
  .split('export const mockCallSheet: CallSheetDraft = ')[1]
  .trim()
const base = Function('return (' + expression.replace(/;\s*$/, '') + ')')()
const people = [
  {
    id: 'p1',
    name: 'Maya Chen',
    category: 'crew',
    roleOrDepartment: 'Director of photography',
    email: 'maya.chen@example.test',
    phone: '+1 555 010 2001',
    notes: 'Camera department lead',
    active: true,
  },
  {
    id: 'p2',
    name: 'Elias Moreno',
    category: 'cast',
    roleOrDepartment: 'Lead · The Traveller',
    email: 'elias.moreno@example.test',
    phone: '+1 555 010 2002',
    notes: '',
    active: true,
  },
  {
    id: 'p3',
    name: 'Samira Okafor',
    category: 'crew',
    roleOrDepartment: 'First assistant director',
    email: 'samira.okafor@example.test',
    phone: '+1 555 010 2003',
    notes: '',
    active: true,
  },
  {
    id: 'p4',
    name: 'Alex Rivera',
    category: 'crew',
    roleOrDepartment: 'Sound mixer',
    email: 'alex.rivera@example.test',
    phone: '',
    notes: '',
    active: false,
  },
  {
    id: 'p5',
    name: 'Studio Emergency Desk',
    category: 'emergency',
    roleOrDepartment: 'Site safety',
    email: 'safety@example.test',
    phone: '+1 555 010 2005',
    notes: 'Available during the studio day',
    active: true,
  },
  {
    id: 'p6',
    name: 'Jordan Lee',
    category: 'other',
    roleOrDepartment: 'Location contact',
    email: '',
    phone: '+1 555 010 2006',
    notes: '',
    active: true,
  },
]
// Replace the repository example's contact details with explicitly fictitious QA contacts.
base.emergencyContacts = base.emergencyContacts.map((x, i) => ({
  ...x,
  name: 'QA Safety Contact ' + (i + 1),
  phone: '+1 555 010 2099',
}))
base.castCalls = base.castCalls.map((x, i) => ({
  ...x,
  castName: 'QA Cast ' + (i + 1),
  email: 'cast' + i + '@example.test',
}))
base.crewCalls = base.crewCalls.map((x, i) => ({
  ...x,
  crewName: 'QA Crew ' + (i + 1),
  email: 'crew' + i + '@example.test',
}))
base.emailReplyTo = 'production@example.test'
const docs = [
  ['d1', 'Whiteout · Day 04 — The Observatory', '2026-11-05', 'draft'],
  [
    'd2',
    'Whiteout · Day 03 — Station exterior',
    '2026-11-04',
    'ready_for_review',
  ],
  ['d3', 'Whiteout · Day 02 — Interior pickups', '2026-11-03', 'approved'],
  ['d4', 'Whiteout · Day 01 — First light', '2026-11-02', 'published'],
  ['d5', 'Camera & lighting test', '2026-11-01', 'revised'],
  ['d6', 'Rehearsal · Principal cast', '', 'draft'],
].map(([id, title, productionDate, status]) => ({
  ...structuredClone(base),
  id,
  title,
  productionDate,
  status,
  primaryCallTime: '06:30',
  distributionStatus: status === 'published' ? 'distributed' : 'not_ready',
  distributionRecipients:
    status === 'draft'
      ? []
      : people
          .slice(0, 3)
          .map((p, i) => ({
            id: 'r' + i,
            sourceType: 'manual',
            name: p.name,
            role: p.roleOrDepartment,
            email: i === 2 ? '' : p.email,
            phone: p.phone,
            included: true,
            confirmationStatus: ['sent', 'confirmed', 'issue'][i],
            notes: '',
          })),
}))
module.exports = { docs, people, base }

export type EmergencyContact = {
  id: string
  label: string
  name: string
  phone: string
}

export type SceneRow = {
  id: string
  sceneNumber: string
  setDescription: string
  castSummary: string
  dayNight: string
  pageCount: string
  locationNotes: string
}

export type CastCallRow = {
  id: string
  castName: string
  roleName: string
  email: string
  callTime: string
  notes: string
}

export type CrewCallRow = {
  id: string
  departmentRole: string
  crewName: string
  email: string
  callTime: string
  notes: string
}

export type CallSheetStatus =
  | 'draft'
  | 'ready_for_review'
  | 'approved'
  | 'published'
  | 'revised'

export const callSheetStatusLabels: Record<CallSheetStatus, string> = {
  draft: 'Draft',
  ready_for_review: 'Ready for AD Review',
  approved: 'Approved',
  published: 'Published',
  revised: 'Revised',
}

export const callSheetStatuses = Object.keys(callSheetStatusLabels) as CallSheetStatus[]

export type CallSheetDraft = {
  id: string
  status: CallSheetStatus
  title: string
  productionDate: string
  primaryCallTime: string
  weatherSummary: string
  weatherTempAtCall: string
  weatherHigh: string
  weatherLow: string
  sunrise: string
  sunset: string
  mainSetName: string
  mainSetAddress: string[]
  nearestHospitalName: string
  nearestHospitalAddress: string[]
  emergencyContacts: EmergencyContact[]
  scenes: SceneRow[]
  castCalls: CastCallRow[]
  crewCalls: CrewCallRow[]
  generalNotes: string
  distributionNotes: string
}

export const mockCallSheet: CallSheetDraft = {
  id: 'draft-test-shoot',
  status: 'draft',
  title: 'Test Shoot Call Sheet',
  productionDate: 'Sunday, April 19, 2026',
  primaryCallTime: '8:00 AM',
  weatherSummary: 'Partly sunny / partly cloudy',
  weatherTempAtCall: '64°F',
  weatherHigh: '68°F',
  weatherLow: '57°F',
  sunrise: '6:15 AM',
  sunset: '7:21 PM',
  mainSetName: 'Media Center & Comm. Building',
  mainSetAddress: [
    'Studio 139',
    '3010 Exploration Dr.',
    'La Jolla, CA 92093',
  ],
  nearestHospitalName: 'Jacobs Medical Center',
  nearestHospitalAddress: [
    '9300 Campus Point Dr.',
    'La Jolla, CA 92037',
  ],
  emergencyContacts: [
    { id: '1', label: 'Exec Prod', name: 'Thamer Alanezi', phone: '(619) 247-7168' },
    { id: '2', label: 'Producer', name: 'Evan Huang', phone: '(858) 378-3456' },
    { id: '3', label: 'Director', name: 'Sardor Danier', phone: '(202) 790-0390' },
    { id: '4', label: '1st AD', name: 'Emma Thompson', phone: '(619) 994-1410' },
  ],
  scenes: [
    {
      id: 's1',
      sceneNumber: 'Test Shoot 1',
      setDescription: 'Camera / lighting / movement test',
      castSummary: 'Luke, Vader, Anakin',
      dayNight: 'D',
      pageCount: '—',
      locationNotes: 'Studio 139',
    },
    {
      id: 's2',
      sceneNumber: 'Test Shoot 2',
      setDescription: 'Costume / makeup / framing test',
      castSummary: 'Luke, Vader',
      dayNight: 'D',
      pageCount: '—',
      locationNotes: 'Studio 139',
    },
  ],
  castCalls: [
    {
      id: 'c1',
      castName: 'Simon Thompson',
      roleName: 'Luke Skywalker',
      email: 'simontschulze@gmail.com',
      callTime: '8:30 AM',
      notes: '',
    },
    {
      id: 'c2',
      castName: 'Kody Knoblock',
      roleName: 'Darth Vader',
      email: 'kknoblock@ucsd.edu',
      callTime: '9:30 AM',
      notes: '',
    },
  ],
  crewCalls: [
    {
      id: 'cr1',
      departmentRole: 'Executive Producer',
      crewName: 'Thamer Alanezi',
      email: 'talanezi@ucsd.edu',
      callTime: '8:00 AM',
      notes: 'Equipment pickup team',
    },
    {
      id: 'cr2',
      departmentRole: 'Director',
      crewName: 'Sardor Danier',
      email: 'sdanier@ucsd.edu',
      callTime: '8:00 AM',
      notes: 'Argo Hall elevator',
    },
  ],
  generalNotes: 'Builder shell only for now. PDF generation and real persistence come next.',
  distributionNotes: '',
}

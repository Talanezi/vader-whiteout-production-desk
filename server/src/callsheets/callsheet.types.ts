export type EmergencyContact = {
  id: string;
  rosterPersonId?: string;
  label: string;
  name: string;
  phone: string;
};

export type SceneRow = {
  id: string;
  sceneNumber: string;
  setDescription: string;
  castSummary: string;
  dayNight: string;
  pageCount: string;
  locationNotes: string;
};

export type CastCallRow = {
  id: string;
  rosterPersonId?: string;
  castName: string;
  roleName: string;
  email: string;
  callTime: string;
  notes: string;
};

export type CrewCallRow = {
  id: string;
  rosterPersonId?: string;
  departmentRole: string;
  crewName: string;
  email: string;
  callTime: string;
  notes: string;
};

export type CallSheetStatus =
  | 'draft'
  | 'ready_for_review'
  | 'approved'
  | 'published'
  | 'revised';

export type DistributionStatus =
  | 'not_ready'
  | 'ready'
  | 'distributed'
  | 'revision_distributed';

export type ConfirmationStatus =
  | 'not_sent'
  | 'sent'
  | 'confirmed'
  | 'no_response'
  | 'issue';

export type DistributionRecipient = {
  id: string;
  sourceType: 'cast' | 'crew' | 'emergency' | 'manual';
  sourceRowId?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  included: boolean;
  confirmationStatus: ConfirmationStatus;
  notes: string;
};

export type EmailAttachmentType =
  | 'call_sheet_pdf'
  | 'flow_of_day'
  | 'shortlist'
  | 'map'
  | 'safety'
  | 'other';

export type EmailAttachment = {
  id: string;
  label: string;
  type: EmailAttachmentType;
  fileName: string;
  url: string;
  notes: string;
  included: boolean;
};

export type EmailTimelineItem = {
  id: string;
  time: string;
  text: string;
};

export type CallSheetDraft = {
  id: string;
  status: CallSheetStatus;
  title: string;
  productionDate: string;
  primaryCallTime: string;
  weatherSummary: string;
  weatherTempAtCall: string;
  weatherHigh: string;
  weatherLow: string;
  sunrise: string;
  sunset: string;
  mainSetName: string;
  mainSetAddress: string[];
  nearestHospitalName: string;
  nearestHospitalAddress: string[];
  emergencyContacts: EmergencyContact[];
  scenes: SceneRow[];
  castCalls: CastCallRow[];
  crewCalls: CrewCallRow[];
  generalNotes: string;
  distributionNotes: string;
  distributionStatus: DistributionStatus;
  distributionRecipients: DistributionRecipient[];
  distributionMessage: string;
  emailSubject: string;
  emailPreheader: string;
  emailHeadline: string;
  emailIntro: string;
  emailSenderName: string;
  emailSenderTitle: string;
  emailReplyTo: string;
  emailHeroImageUrl: string;
  emailTransportTitle: string;
  emailTransportDetails: string;
  emailWeatherTitle: string;
  emailWeatherDetails: string;
  emailSetTitle: string;
  emailSetDetails: string;
  emailPrepNotes: string;
  emailSuppliesNotes: string;
  emailClosingMessage: string;
  emailAttachments: EmailAttachment[];
  emailTimelineItems: EmailTimelineItem[];
};

export type RosterCategory = 'cast' | 'crew' | 'emergency' | 'other';

export type RosterPerson = {
  id: string;
  name: string;
  category: RosterCategory;
  roleOrDepartment: string;
  email: string;
  phone: string;
  notes: string;
  active: boolean;
};

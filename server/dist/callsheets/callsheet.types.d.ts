export type EmergencyContact = {
    id: string;
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
    castName: string;
    roleName: string;
    email: string;
    callTime: string;
    notes: string;
};
export type CrewCallRow = {
    id: string;
    departmentRole: string;
    crewName: string;
    email: string;
    callTime: string;
    notes: string;
};
export type CallSheetDraft = {
    id: string;
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
};

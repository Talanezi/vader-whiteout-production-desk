"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callSheetStore = exports.seedCallSheet = void 0;
exports.seedCallSheet = {
    id: 'draft-test-shoot',
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
    mainSetAddress: ['Studio 139', '3010 Exploration Dr.', 'La Jolla, CA 92093'],
    nearestHospitalName: 'Jacobs Medical Center',
    nearestHospitalAddress: ['9300 Campus Point Dr.', 'La Jolla, CA 92037'],
    emergencyContacts: [
        { id: '1', label: 'Exec Prod', name: 'Thamer Alanezi', phone: '(619) 247-7168' },
        { id: '2', label: 'Producer', name: 'Evan Huang', phone: '(858) 378-3456' },
        { id: '3', label: 'Director', name: 'Sardor Danier', phone: '(202) 790-0390' },
        { id: '4', label: '1st AD', name: 'Emma Thompson', phone: '(619) 994-1410' }
    ],
    scenes: [
        {
            id: 's1',
            sceneNumber: 'Test Shoot 1',
            setDescription: 'Camera / lighting / movement test',
            castSummary: 'Luke, Vader, Anakin',
            dayNight: 'D',
            pageCount: '—',
            locationNotes: 'Studio 139'
        }
    ],
    castCalls: [
        {
            id: 'c1',
            castName: 'Simon Thompson',
            roleName: 'Luke Skywalker',
            email: 'simontschulze@gmail.com',
            callTime: '8:30 AM',
            notes: ''
        }
    ],
    crewCalls: [
        {
            id: 'cr1',
            departmentRole: 'Executive Producer',
            crewName: 'Thamer Alanezi',
            email: 'talanezi@ucsd.edu',
            callTime: '8:00 AM',
            notes: 'Equipment pickup team'
        }
    ],
    generalNotes: 'Builder shell only for now. PDF generation and real persistence come next.'
};
exports.callSheetStore = new Map([
    [exports.seedCallSheet.id, exports.seedCallSheet],
]);
//# sourceMappingURL=callsheets.store.js.map
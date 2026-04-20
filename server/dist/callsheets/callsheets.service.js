"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsheetsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const callsheets_store_1 = require("./callsheets.store");
let CallsheetsService = class CallsheetsService {
    list() {
        return {
            items: Array.from(callsheets_store_1.callSheetStore.values()),
            total: callsheets_store_1.callSheetStore.size,
        };
    }
    getById(id) {
        const item = callsheets_store_1.callSheetStore.get(id);
        if (!item) {
            throw new common_1.NotFoundException('Call sheet not found');
        }
        return item;
    }
    create(payload) {
        const id = payload?.id?.trim() || `draft-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        const item = {
            id,
            title: payload?.title || 'Untitled Call Sheet',
            productionDate: payload?.productionDate || '',
            primaryCallTime: payload?.primaryCallTime || '',
            weatherSummary: payload?.weatherSummary || '',
            weatherTempAtCall: payload?.weatherTempAtCall || '',
            weatherHigh: payload?.weatherHigh || '',
            weatherLow: payload?.weatherLow || '',
            sunrise: payload?.sunrise || '',
            sunset: payload?.sunset || '',
            mainSetName: payload?.mainSetName || '',
            mainSetAddress: payload?.mainSetAddress || [],
            nearestHospitalName: payload?.nearestHospitalName || '',
            nearestHospitalAddress: payload?.nearestHospitalAddress || [],
            emergencyContacts: payload?.emergencyContacts || [],
            scenes: payload?.scenes || [],
            castCalls: payload?.castCalls || [],
            crewCalls: payload?.crewCalls || [],
            generalNotes: payload?.generalNotes || '',
        };
        callsheets_store_1.callSheetStore.set(id, item);
        return item;
    }
    update(id, payload) {
        const existing = this.getById(id);
        const next = {
            ...existing,
            ...payload,
            id,
        };
        callsheets_store_1.callSheetStore.set(id, next);
        return next;
    }
};
exports.CallsheetsService = CallsheetsService;
exports.CallsheetsService = CallsheetsService = __decorate([
    (0, common_1.Injectable)()
], CallsheetsService);
//# sourceMappingURL=callsheets.service.js.map
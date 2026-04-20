"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsheetsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const callsheet_draft_entity_1 = require("./entities/callsheet-draft.entity");
let CallsheetsService = class CallsheetsService {
    constructor(callsheetsRepo) {
        this.callsheetsRepo = callsheetsRepo;
    }
    normalizeDraft(id, payload) {
        return {
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
    }
    entityToDraft(entity) {
        return this.normalizeDraft(entity.id, entity.payload);
    }
    async list() {
        const rows = await this.callsheetsRepo.find({
            order: { updatedAt: 'DESC' },
        });
        return {
            items: rows.map((row) => this.entityToDraft(row)),
            total: rows.length,
        };
    }
    async getById(id) {
        const row = await this.callsheetsRepo.findOne({ where: { id } });
        if (!row) {
            throw new common_1.NotFoundException('Call sheet not found');
        }
        return this.entityToDraft(row);
    }
    async create(payload) {
        const id = payload?.id?.trim() || `draft-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        const draft = this.normalizeDraft(id, payload);
        const row = this.callsheetsRepo.create({
            id: draft.id,
            title: draft.title,
            productionDate: draft.productionDate,
            payload: draft,
        });
        const saved = await this.callsheetsRepo.save(row);
        return this.entityToDraft(saved);
    }
    async update(id, payload) {
        const existing = await this.callsheetsRepo.findOne({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Call sheet not found');
        }
        const merged = this.normalizeDraft(id, {
            ...existing.payload,
            ...payload,
            id,
        });
        existing.title = merged.title;
        existing.productionDate = merged.productionDate;
        existing.payload = merged;
        const saved = await this.callsheetsRepo.save(existing);
        return this.entityToDraft(saved);
    }
};
exports.CallsheetsService = CallsheetsService;
exports.CallsheetsService = CallsheetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(callsheet_draft_entity_1.CallSheetDraftEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CallsheetsService);
//# sourceMappingURL=callsheets.service.js.map
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallSheetDraft, CallSheetStatus } from './callsheet.types';
import { CallSheetDraftEntity } from './entities/callsheet-draft.entity';

const supportedStatuses: CallSheetStatus[] = [
  'draft',
  'ready_for_review',
  'approved',
  'published',
  'revised',
];

@Injectable()
export class CallsheetsService {
  constructor(
    @InjectRepository(CallSheetDraftEntity)
    private readonly callsheetsRepo: Repository<CallSheetDraftEntity>,
  ) {}

  private normalizeStatus(status: unknown): CallSheetStatus {
    return typeof status === 'string' && supportedStatuses.includes(status as CallSheetStatus)
      ? (status as CallSheetStatus)
      : 'draft';
  }

  private normalizeDraft(id: string, payload?: Partial<CallSheetDraft>): CallSheetDraft {
    return {
      id,
      status: this.normalizeStatus(payload?.status),
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
      distributionNotes: payload?.distributionNotes || '',
    };
  }

  private entityToDraft(entity: CallSheetDraftEntity): CallSheetDraft {
    return this.normalizeDraft(entity.id, entity.payload as Partial<CallSheetDraft>);
  }

  async list(_userID: number) {
    const rows = await this.callsheetsRepo.find({
      order: { updatedAt: 'DESC' },
    });

    return {
      items: rows.map((row) => this.entityToDraft(row)),
      total: rows.length,
    };
  }

  async getById(_userID: number, id: string) {
    const row = await this.callsheetsRepo.findOne({
      where: { id },
    });

    if (!row) {
      throw new NotFoundException('Call sheet not found');
    }

    return this.entityToDraft(row);
  }

  async create(userID: number, payload?: Partial<CallSheetDraft>) {
    const id = payload?.id?.trim() || `draft-${randomUUID().slice(0, 8)}`;
    const draft = this.normalizeDraft(id, payload);

    const row = this.callsheetsRepo.create({
      id: draft.id,
      CreatedByUserID: userID,
      title: draft.title,
      productionDate: draft.productionDate,
      payload: draft,
    });

    const saved = await this.callsheetsRepo.save(row);
    return this.entityToDraft(saved);
  }

  async duplicate(userID: number, id: string) {
    const existing = await this.callsheetsRepo.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Call sheet not found');
    }

    const draft = this.entityToDraft(existing);
    return this.create(userID, {
      ...draft,
      id: undefined,
      title: `${draft.title || 'Untitled Call Sheet'} Copy`,
    });
  }

  async update(_userID: number, id: string, payload: Partial<CallSheetDraft>) {
    const existing = await this.callsheetsRepo.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Call sheet not found');
    }

    const merged = this.normalizeDraft(id, {
      ...(existing.payload as Partial<CallSheetDraft>),
      ...payload,
      id,
    });

    existing.title = merged.title;
    existing.productionDate = merged.productionDate;
    existing.payload = merged;

    const saved = await this.callsheetsRepo.save(existing);
    return this.entityToDraft(saved);
  }

  async remove(_userID: number, id: string) {
    const existing = await this.callsheetsRepo.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Call sheet not found');
    }

    await this.callsheetsRepo.remove(existing);
    return { ok: true, id };
  }
}

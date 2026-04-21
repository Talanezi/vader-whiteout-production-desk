import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallSheetDraft } from './callsheet.types';
import { CallSheetDraftEntity } from './entities/callsheet-draft.entity';

@Injectable()
export class CallsheetsService {
  constructor(
    @InjectRepository(CallSheetDraftEntity)
    private readonly callsheetsRepo: Repository<CallSheetDraftEntity>,
  ) {}

  private normalizeDraft(id: string, payload?: Partial<CallSheetDraft>): CallSheetDraft {
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

  private entityToDraft(entity: CallSheetDraftEntity): CallSheetDraft {
    return this.normalizeDraft(entity.id, entity.payload as Partial<CallSheetDraft>);
  }

  async list(userID: number) {
    const rows = await this.callsheetsRepo.find({
      where: { CreatedByUserID: userID },
      order: { updatedAt: 'DESC' },
    });

    return {
      items: rows.map((row) => this.entityToDraft(row)),
      total: rows.length,
    };
  }

  async getById(userID: number, id: string) {
    const row = await this.callsheetsRepo.findOne({
      where: { id, CreatedByUserID: userID },
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
      where: { id, CreatedByUserID: userID },
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

  async update(userID: number, id: string, payload: Partial<CallSheetDraft>) {
    const existing = await this.callsheetsRepo.findOne({
      where: { id, CreatedByUserID: userID },
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

  async remove(userID: number, id: string) {
    const existing = await this.callsheetsRepo.findOne({
      where: { id, CreatedByUserID: userID },
    });

    if (!existing) {
      throw new NotFoundException('Call sheet not found');
    }

    await this.callsheetsRepo.remove(existing);
    return { ok: true, id };
  }
}

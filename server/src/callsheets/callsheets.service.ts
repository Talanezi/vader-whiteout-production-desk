import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallSheetDraft } from './callsheet.types';
import { CallSheetDraftEntity } from './entities/callsheet-draft.entity';

@Injectable()
export class CallsheetsService {
  private readonly logger = new Logger(CallsheetsService.name);

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

  async list() {
    const rows = await this.callsheetsRepo.find({
      order: { updatedAt: 'DESC' },
    });

    return {
      items: rows.map((row) => this.entityToDraft(row)),
      total: rows.length,
    };
  }

  async getById(id: string) {
    const row = await this.callsheetsRepo.findOne({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('Call sheet not found');
    }
    return this.entityToDraft(row);
  }

  async create(userID: number | null, payload?: Partial<CallSheetDraft>) {
    const id = payload?.id?.trim() || `draft-${randomUUID().slice(0, 8)}`;
    const draft = this.normalizeDraft(id, payload);

    const row = this.callsheetsRepo.create({
      id: draft.id,
      CreatedByUserID: userID ?? null,
      title: draft.title,
      productionDate: draft.productionDate,
      payload: draft,
    });

    try {
      const saved = await this.callsheetsRepo.save(row);
      return this.entityToDraft(saved);
    } catch (error) {
      this.logger.error(
        `Failed to create call sheet id=${draft.id} createdBy=${userID ?? 'null'}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to save call sheet draft');
    }
  }

  async update(id: string, payload: Partial<CallSheetDraft>) {
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

    try {
      const saved = await this.callsheetsRepo.save(existing);
      return this.entityToDraft(saved);
    } catch (error) {
      this.logger.error(
        `Failed to update call sheet id=${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update call sheet draft');
    }
  }
}

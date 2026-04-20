import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CallSheetDraft } from './callsheet.types';
import { callSheetStore } from './callsheets.store';

@Injectable()
export class CallsheetsService {
  list() {
    return {
      items: Array.from(callSheetStore.values()),
      total: callSheetStore.size,
    };
  }

  getById(id: string) {
    const item = callSheetStore.get(id);
    if (!item) {
      throw new NotFoundException('Call sheet not found');
    }
    return item;
  }

  create(payload?: Partial<CallSheetDraft>) {
    const id = payload?.id?.trim() || `draft-${randomUUID().slice(0, 8)}`;
    const item: CallSheetDraft = {
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

    callSheetStore.set(id, item);
    return item;
  }

  update(id: string, payload: Partial<CallSheetDraft>) {
    const existing = this.getById(id);
    const next: CallSheetDraft = {
      ...existing,
      ...payload,
      id,
    };
    callSheetStore.set(id, next);
    return next;
  }
}

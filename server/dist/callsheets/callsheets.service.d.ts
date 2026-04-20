import { Repository } from 'typeorm';
import { CallSheetDraft } from './callsheet.types';
import { CallSheetDraftEntity } from './entities/callsheet-draft.entity';
export declare class CallsheetsService {
    private readonly callsheetsRepo;
    constructor(callsheetsRepo: Repository<CallSheetDraftEntity>);
    private normalizeDraft;
    private entityToDraft;
    list(): Promise<{
        items: CallSheetDraft[];
        total: number;
    }>;
    getById(id: string): Promise<CallSheetDraft>;
    create(payload?: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
    update(id: string, payload: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
}

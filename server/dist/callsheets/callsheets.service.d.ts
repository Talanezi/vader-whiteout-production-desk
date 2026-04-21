import { Repository } from 'typeorm';
import { CallSheetDraft } from './callsheet.types';
import { CallSheetDraftEntity } from './entities/callsheet-draft.entity';
export declare class CallsheetsService {
    private readonly callsheetsRepo;
    constructor(callsheetsRepo: Repository<CallSheetDraftEntity>);
    private normalizeDraft;
    private entityToDraft;
    list(userID: number): Promise<{
        items: CallSheetDraft[];
        total: number;
    }>;
    getById(userID: number, id: string): Promise<CallSheetDraft>;
    create(userID: number, payload?: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
    duplicate(userID: number, id: string): Promise<CallSheetDraft>;
    update(userID: number, id: string, payload: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
    remove(userID: number, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
}

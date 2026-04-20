import { CallSheetDraft } from './callsheet.types';
export declare class CallsheetsService {
    list(): {
        items: CallSheetDraft[];
        total: number;
    };
    getById(id: string): CallSheetDraft;
    create(payload?: Partial<CallSheetDraft>): CallSheetDraft;
    update(id: string, payload: Partial<CallSheetDraft>): CallSheetDraft;
}

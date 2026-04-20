import { CallsheetsService } from './callsheets.service';
import { CallSheetDraft } from './callsheet.types';
export declare class CallsheetsController {
    private readonly callsheetsService;
    constructor(callsheetsService: CallsheetsService);
    list(): Promise<{
        items: CallSheetDraft[];
        total: number;
    }>;
    getById(id: string): Promise<CallSheetDraft>;
    create(payload: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
    update(id: string, payload: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
}

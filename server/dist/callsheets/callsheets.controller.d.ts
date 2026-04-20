import { CallsheetsService } from './callsheets.service';
import { CallSheetDraft } from './callsheet.types';
export declare class CallsheetsController {
    private readonly callsheetsService;
    constructor(callsheetsService: CallsheetsService);
    list(): {
        items: CallSheetDraft[];
        total: number;
    };
    getById(id: string): CallSheetDraft;
    create(payload: Partial<CallSheetDraft>): CallSheetDraft;
    update(id: string, payload: Partial<CallSheetDraft>): CallSheetDraft;
}

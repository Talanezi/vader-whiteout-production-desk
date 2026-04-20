import type { Request } from 'express';
import { CallsheetsService } from './callsheets.service';
import { CallSheetDraft } from './callsheet.types';
export declare class CallsheetsController {
    private readonly callsheetsService;
    constructor(callsheetsService: CallsheetsService);
    list(req: Request & {
        user: {
            userID: number;
        };
    }): Promise<{
        items: CallSheetDraft[];
        total: number;
    }>;
    getById(req: Request & {
        user: {
            userID: number;
        };
    }, id: string): Promise<CallSheetDraft>;
    create(req: Request & {
        user: {
            userID: number;
        };
    }, payload: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
    update(req: Request & {
        user: {
            userID: number;
        };
    }, id: string, payload: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
}

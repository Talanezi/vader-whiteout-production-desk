import type { Request, Response } from 'express';
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
    downloadPdf(req: Request & {
        user: {
            userID: number;
        };
    }, id: string, res: Response): Promise<void>;
    create(req: Request & {
        user: {
            userID: number;
        };
    }, payload: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
    duplicate(req: Request & {
        user: {
            userID: number;
        };
    }, id: string): Promise<CallSheetDraft>;
    update(req: Request & {
        user: {
            userID: number;
        };
    }, id: string, payload: Partial<CallSheetDraft>): Promise<CallSheetDraft>;
    remove(req: Request & {
        user: {
            userID: number;
        };
    }, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
}

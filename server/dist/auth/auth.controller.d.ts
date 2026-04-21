import type { Request } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    me(req: Request & {
        headers: {
            authorization?: string;
        };
        user?: {
            userID: number;
            email: string;
            name: string;
        };
    }): Promise<{
        id: number;
        email: string;
        name: string;
    }>;
}

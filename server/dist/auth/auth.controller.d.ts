import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        token: string;
        user: {
            id: number;
            email: string;
            name: string;
        };
    }>;
    me(req: Request & {
        user: {
            userID: number;
        };
    }): Promise<{
        id: number;
        email: string;
        name: string;
    }>;
}

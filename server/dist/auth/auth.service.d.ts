import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
export declare class AuthService {
    private readonly usersRepo;
    private readonly jwtService;
    constructor(usersRepo: Repository<UserEntity>, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<UserEntity>;
    login(email: string, password: string): Promise<{
        token: string;
        user: {
            id: number;
            email: string;
            name: string;
        };
    }>;
    me(userID: number): Promise<{
        id: number;
        email: string;
        name: string;
    }>;
}

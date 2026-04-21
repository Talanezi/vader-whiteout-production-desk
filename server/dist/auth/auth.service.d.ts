export declare class AuthService {
    private getSchedulerApiBaseUrl;
    verifySchedulerToken(token: string): Promise<{
        userID: number;
        email: string;
        name: string;
    }>;
    meFromToken(token: string): Promise<{
        id: number;
        email: string;
        name: string;
    }>;
}

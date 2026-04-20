export declare class UserEntity {
    ID: number;
    PasswordHash?: string;
    TimestampOfEarliestValidToken?: number;
    Name: string;
    Email: string;
    IsSubscribedToNotifications: boolean;
    Department?: string;
    Role?: string;
}

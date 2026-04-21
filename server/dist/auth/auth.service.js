"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
let AuthService = class AuthService {
    getSchedulerApiBaseUrl() {
        return (process.env.SCHEDULER_API_BASE_URL ||
            'https://vader-whiteout-scheduler-production.up.railway.app').replace(/\/$/, '');
    }
    async verifySchedulerToken(token) {
        const response = await fetch(`${this.getSchedulerApiBaseUrl()}/api/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new common_1.UnauthorizedException('Invalid scheduler session');
        }
        const user = (await response.json());
        const userID = user.userID ?? user.id ?? user.ID;
        const email = user.email ?? user.Email;
        const name = user.name ?? user.Name;
        if (!userID || !email || !name) {
            throw new common_1.UnauthorizedException('Invalid scheduler session');
        }
        return {
            userID: Number(userID),
            email,
            name,
        };
    }
    async meFromToken(token) {
        const user = await this.verifySchedulerToken(token);
        return {
            id: user.userID,
            email: user.email,
            name: user.name,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)()
], AuthService);
//# sourceMappingURL=auth.service.js.map
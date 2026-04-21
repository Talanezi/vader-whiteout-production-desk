"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsheetsController = void 0;
const common_1 = require("@nestjs/common");
const scheduler_auth_guard_1 = require("../auth/scheduler-auth.guard");
const callsheets_service_1 = require("./callsheets.service");
const build_callsheet_latex_1 = require("./pdf/build-callsheet-latex");
const compile_latex_to_pdf_1 = require("./pdf/compile-latex-to-pdf");
let CallsheetsController = class CallsheetsController {
    constructor(callsheetsService) {
        this.callsheetsService = callsheetsService;
    }
    list(req) {
        return this.callsheetsService.list(req.user.userID);
    }
    getById(req, id) {
        return this.callsheetsService.getById(req.user.userID, id);
    }
    async downloadPdf(req, id, res) {
        const draft = await this.callsheetsService.getById(req.user.userID, id);
        const tex = (0, build_callsheet_latex_1.buildCallSheetLatex)(draft);
        const pdf = await (0, compile_latex_to_pdf_1.compileLatexToPdf)(tex);
        const safeName = (draft.title || 'callsheet').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
        res.send(pdf);
    }
    create(req, payload) {
        return this.callsheetsService.create(req.user.userID, payload);
    }
    duplicate(req, id) {
        return this.callsheetsService.duplicate(req.user.userID, id);
    }
    update(req, id, payload) {
        return this.callsheetsService.update(req.user.userID, id, payload);
    }
    remove(req, id) {
        return this.callsheetsService.remove(req.user.userID, id);
    }
};
exports.CallsheetsController = CallsheetsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CallsheetsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CallsheetsController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CallsheetsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CallsheetsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CallsheetsController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CallsheetsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CallsheetsController.prototype, "remove", null);
exports.CallsheetsController = CallsheetsController = __decorate([
    (0, common_1.UseGuards)(scheduler_auth_guard_1.SchedulerAuthGuard),
    (0, common_1.Controller)('api/callsheets'),
    __metadata("design:paramtypes", [callsheets_service_1.CallsheetsService])
], CallsheetsController);
//# sourceMappingURL=callsheets.controller.js.map
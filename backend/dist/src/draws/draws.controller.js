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
exports.DrawsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const draws_service_1 = require("./draws.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let DrawsController = class DrawsController {
    constructor(svc, prisma) {
        this.svc = svc;
        this.prisma = prisma;
    }
    findAll(tid) {
        return this.prisma.draw.findMany({ where: { tournamentId: tid }, orderBy: { createdAt: 'desc' } });
    }
    proposal(tid) { return this.svc.calculatePotProposal(tid); }
    pots(tid) { return this.svc.executePotsDrawl(tid); }
    snake(tid) { return this.svc.executeSnakeDraft(tid); }
    balanced(tid, body) {
        return this.svc.executeBalancedAuto(tid, body.teamsPerParticipant);
    }
};
exports.DrawsController = DrawsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('tournamentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DrawsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':tournamentId/proposal'),
    __param(0, (0, common_1.Param)('tournamentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DrawsController.prototype, "proposal", null);
__decorate([
    (0, common_1.Post)(':tournamentId/pots'),
    __param(0, (0, common_1.Param)('tournamentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DrawsController.prototype, "pots", null);
__decorate([
    (0, common_1.Post)(':tournamentId/snake'),
    __param(0, (0, common_1.Param)('tournamentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DrawsController.prototype, "snake", null);
__decorate([
    (0, common_1.Post)(':tournamentId/balanced'),
    __param(0, (0, common_1.Param)('tournamentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DrawsController.prototype, "balanced", null);
exports.DrawsController = DrawsController = __decorate([
    (0, swagger_1.ApiTags)('Draws'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('draws'),
    __metadata("design:paramtypes", [draws_service_1.DrawsService, prisma_service_1.PrismaService])
], DrawsController);
//# sourceMappingURL=draws.controller.js.map
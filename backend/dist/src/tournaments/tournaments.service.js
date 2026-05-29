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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TournamentsService = class TournamentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.tournament.findMany({
            include: { _count: { select: { participants: true, teams: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.tournament.findUniqueOrThrow({
            where: { id },
            include: {
                participants: { include: { teams: true } },
                phases: { orderBy: { roundNumber: 'asc' } },
                scoringRules: { where: { isActive: true } },
                _count: { select: { teams: true } },
            },
        });
    }
    create(data) {
        return this.prisma.tournament.create({ data: { ...data, scoringConfig: data.scoringConfig || {} } });
    }
    update(id, data) {
        return this.prisma.tournament.update({ where: { id }, data });
    }
    async updateStatus(id, status) {
        const tournament = await this.prisma.tournament.findUniqueOrThrow({ where: { id } });
        const allowed = {
            SETUP: ['DRAW_PENDING'],
            DRAW_PENDING: ['SETUP', 'IN_PROGRESS'],
            IN_PROGRESS: ['FINISHED'],
            FINISHED: [],
        };
        if (!allowed[tournament.status]?.includes(status)) {
            throw new common_1.BadRequestException(`No se puede cambiar de ${tournament.status} a ${status}`);
        }
        return this.prisma.tournament.update({ where: { id }, data: { status: status } });
    }
    async delete(id) {
        const t = await this.prisma.tournament.findUniqueOrThrow({ where: { id } });
        if (t.status === 'IN_PROGRESS')
            throw new common_1.BadRequestException('No se puede eliminar un torneo en curso');
        return this.prisma.tournament.delete({ where: { id } });
    }
    getScoringRules(tournamentId) {
        return this.prisma.scoringRule.findMany({ where: { tournamentId }, orderBy: { eventType: 'asc' } });
    }
    updateScoringRule(ruleId, points, isActive) {
        return this.prisma.scoringRule.update({ where: { id: ruleId }, data: { points, isActive } });
    }
    async upsertScoringRule(tournamentId, eventType, points, description) {
        return this.prisma.scoringRule.upsert({
            where: { tournamentId_eventType: { tournamentId, eventType: eventType } },
            update: { points, description },
            create: { tournamentId, eventType: eventType, points, isActive: true, description },
        });
    }
};
exports.TournamentsService = TournamentsService;
exports.TournamentsService = TournamentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TournamentsService);
//# sourceMappingURL=tournaments.service.js.map
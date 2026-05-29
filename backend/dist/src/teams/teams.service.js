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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TeamsService = class TeamsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByTournament(tournamentId) {
        return this.prisma.team.findMany({
            where: { tournamentId },
            include: { participant: { select: { id: true, name: true, alias: true } }, pot: true },
            orderBy: [{ status: 'asc' }, { strength: 'desc' }],
        });
    }
    findOne(id) {
        return this.prisma.team.findUniqueOrThrow({
            where: { id },
            include: {
                participant: true,
                pot: true,
                scores: { orderBy: { earnedAt: 'desc' } },
                homeMatches: { include: { result: true, phase: true } },
                awayMatches: { include: { result: true, phase: true } },
            },
        });
    }
    create(data) {
        return this.prisma.team.create({ data, include: { pot: true } });
    }
    update(id, data) {
        return this.prisma.team.update({ where: { id }, data });
    }
    async assignToParticipant(teamId, participantId) {
        return this.prisma.team.update({ where: { id: teamId }, data: { participantId } });
    }
    delete(id) {
        return this.prisma.team.delete({ where: { id } });
    }
    async importFromCsv(tournamentId, csvContent) {
        const lines = csvContent.trim().split('\n').slice(1);
        const created = [];
        for (const line of lines) {
            const [name, country, strength] = line.split(',').map(s => s.trim().replace(/"/g, ''));
            if (!name)
                continue;
            try {
                const team = await this.prisma.team.create({
                    data: { tournamentId, name, country: country || '', strength: parseInt(strength) || 50 },
                });
                created.push(team);
            }
            catch (_) { }
        }
        return { imported: created.length, teams: created };
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map
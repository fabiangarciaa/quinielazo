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
exports.PhasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PhasesService = class PhasesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByTournament(tournamentId) {
        return this.prisma.tournamentPhase.findMany({
            where: { tournamentId },
            orderBy: { roundNumber: 'asc' },
            include: { _count: { select: { matches: true } } },
        });
    }
    create(data) {
        return this.prisma.tournamentPhase.create({
            data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined },
        });
    }
    update(id, data) {
        return this.prisma.tournamentPhase.update({
            where: { id },
            data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined },
        });
    }
    async setActive(id) {
        const phase = await this.prisma.tournamentPhase.findUniqueOrThrow({ where: { id } });
        await this.prisma.tournamentPhase.updateMany({ where: { tournamentId: phase.tournamentId }, data: { isActive: false } });
        return this.prisma.tournamentPhase.update({ where: { id }, data: { isActive: true } });
    }
    delete(id) {
        return this.prisma.tournamentPhase.delete({ where: { id } });
    }
    async closePhase(phaseId, advancingTeamIds) {
        const phase = await this.prisma.tournamentPhase.findUniqueOrThrow({
            where: { id: phaseId },
            include: { matches: { include: { homeTeam: true, awayTeam: true } } },
        });
        const teamIdsInPhase = new Set();
        for (const match of phase.matches) {
            teamIdsInPhase.add(match.homeTeamId);
            teamIdsInPhase.add(match.awayTeamId);
        }
        let teamIds = [...teamIdsInPhase];
        if (teamIds.length === 0) {
            const allTeams = await this.prisma.team.findMany({
                where: { tournamentId: phase.tournamentId, status: 'ACTIVE' },
                select: { id: true },
            });
            teamIds = allTeams.map(t => t.id);
        }
        const eliminatedIds = teamIds.filter(id => !advancingTeamIds.includes(id));
        await this.prisma.team.updateMany({
            where: { id: { in: eliminatedIds } },
            data: { status: 'ELIMINATED', phaseReached: phase.name },
        });
        if (advancingTeamIds.length > 0) {
            await this.prisma.team.updateMany({
                where: { id: { in: advancingTeamIds } },
                data: { status: 'ACTIVE' },
            });
        }
        await this.prisma.tournamentPhase.update({ where: { id: phaseId }, data: { isActive: false } });
        return {
            phaseId,
            phaseName: phase.name,
            eliminated: eliminatedIds.length,
            advancing: advancingTeamIds.length,
            message: `${advancingTeamIds.length} equipos clasifican, ${eliminatedIds.length} eliminados.`,
        };
    }
    async getTeamsInPhase(phaseId) {
        const phase = await this.prisma.tournamentPhase.findUniqueOrThrow({
            where: { id: phaseId },
            include: {
                matches: {
                    include: {
                        homeTeam: { include: { participant: { select: { id: true, name: true, alias: true } } } },
                        awayTeam: { include: { participant: { select: { id: true, name: true, alias: true } } } },
                    },
                },
            },
        });
        const teamsMap = new Map();
        for (const match of phase.matches) {
            if (!teamsMap.has(match.homeTeamId))
                teamsMap.set(match.homeTeamId, match.homeTeam);
            if (!teamsMap.has(match.awayTeamId))
                teamsMap.set(match.awayTeamId, match.awayTeam);
        }
        if (teamsMap.size === 0) {
            return this.prisma.team.findMany({
                where: { tournamentId: phase.tournamentId, status: 'ACTIVE' },
                include: { participant: { select: { id: true, name: true, alias: true } } },
                orderBy: { strength: 'desc' },
            });
        }
        return [...teamsMap.values()].sort((a, b) => b.strength - a.strength);
    }
};
exports.PhasesService = PhasesService;
exports.PhasesService = PhasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PhasesService);
//# sourceMappingURL=phases.service.js.map
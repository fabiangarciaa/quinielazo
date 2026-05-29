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
exports.PotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PotsService = class PotsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByTournament(tournamentId) {
        return this.prisma.pot.findMany({
            where: { tournamentId },
            include: {
                teams: {
                    include: { participant: { select: { id: true, name: true, alias: true } } },
                    orderBy: { strength: 'desc' },
                },
            },
            orderBy: { level: 'asc' },
        });
    }
    create(data) {
        return this.prisma.pot.create({ data, include: { teams: true } });
    }
    update(id, data) {
        return this.prisma.pot.update({ where: { id }, data });
    }
    delete(id) {
        return this.prisma.pot.delete({ where: { id } });
    }
    async autoAssignTeamsToPots(tournamentId) {
        const tournament = await this.prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
        const teams = await this.prisma.team.findMany({ where: { tournamentId }, orderBy: { strength: 'desc' } });
        if (teams.length === 0)
            return { message: 'No hay equipos en este torneo.' };
        const numParticipants = tournament.participantCount;
        const totalTeams = teams.length;
        const teamsPerPot = numParticipants;
        const numPots = Math.floor(totalTeams / teamsPerPot);
        await this.prisma.team.updateMany({ where: { tournamentId }, data: { potId: null } });
        await this.prisma.pot.deleteMany({ where: { tournamentId } });
        let teamIndex = 0;
        for (let i = 0; i < numPots; i++) {
            const slice = teams.slice(teamIndex, teamIndex + teamsPerPot);
            teamIndex += teamsPerPot;
            if (slice.length === 0)
                break;
            const strengths = slice.map(t => t.strength);
            const pot = await this.prisma.pot.create({
                data: {
                    tournamentId,
                    name: `Bombo ${i + 1}`,
                    level: i + 1,
                    strengthMin: Math.min(...strengths),
                    strengthMax: Math.max(...strengths),
                    teamsPerParticipant: 1,
                },
            });
            await this.prisma.team.updateMany({
                where: { id: { in: slice.map(t => t.id) } },
                data: { potId: pot.id },
            });
        }
        const potsCreated = await this.prisma.pot.count({ where: { tournamentId } });
        const teamsAssigned = await this.prisma.team.count({ where: { tournamentId, potId: { not: null } } });
        return {
            message: `Se crearon ${potsCreated} bombos con ${teamsAssigned} equipos distribuidos por fuerza (ranking general).`,
            potsCreated,
            teamsAssigned,
            teamsPerPot,
            numPots,
        };
    }
};
exports.PotsService = PotsService;
exports.PotsService = PotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PotsService);
//# sourceMappingURL=pots.service.js.map
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
exports.SimulatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SimulatorService = class SimulatorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async simulate(tournamentId) {
        const participants = await this.prisma.participant.findMany({
            where: { tournamentId },
            include: {
                teams: { where: { status: 'ACTIVE' } },
            },
        });
        const rules = await this.prisma.scoringRule.findMany({
            where: { tournamentId, isActive: true },
        });
        const getPoints = (eventType) => rules.find(r => r.eventType === eventType)?.points || 0;
        const maxPointsIfChampion = getPoints('WIN_GROUP') * 3 +
            getPoints('ADVANCE_ROUND_OF_32') +
            getPoints('ADVANCE_ROUND_OF_16') +
            getPoints('ADVANCE_QUARTER') +
            getPoints('ADVANCE_SEMI') +
            getPoints('REACH_FINAL') +
            getPoints('CHAMPION') +
            getPoints('CLEAN_SHEET') * 4 +
            getPoints('THRASHING_WIN') * 2;
        const allParticipants = await this.prisma.participant.findMany({
            where: { tournamentId },
        });
        const scenarios = [];
        for (const p of participants) {
            const maxPossible = p.totalPoints + p.teams.length * maxPointsIfChampion;
            const canOvertake = allParticipants
                .filter(other => other.id !== p.id && other.totalPoints > p.totalPoints)
                .map(other => ({
                targetName: other.alias || other.name,
                pointsNeeded: other.totalPoints - p.totalPoints + 1,
                feasible: maxPossible > other.totalPoints,
            }));
            const criticalTeams = p.teams.map(team => ({
                teamName: team.name,
                pointsIfChampion: maxPointsIfChampion,
            }));
            const hypotheticalPoints = maxPossible;
            const bestCaseRank = allParticipants.filter(other => other.id !== p.id && other.totalPoints + (other.currentRank <= p.currentRank ? 10 : 0) >= hypotheticalPoints).length + 1;
            scenarios.push({
                participantId: p.id,
                participantName: p.alias || p.name,
                currentPoints: p.totalPoints,
                maxPossiblePoints: maxPossible,
                bestCaseRank,
                aliveTeams: p.teams.length,
                canOvertake,
                criticalTeams,
            });
        }
        return scenarios.sort((a, b) => b.currentPoints - a.currentPoints);
    }
    async simulateTeamWin(tournamentId, teamId) {
        const team = await this.prisma.team.findUniqueOrThrow({
            where: { id: teamId },
            include: { participant: true },
        });
        const rules = await this.prisma.scoringRule.findMany({
            where: { tournamentId, isActive: true },
        });
        const getPoints = (e) => rules.find(r => r.eventType === e)?.points || 0;
        const pointsGained = getPoints('ADVANCE_QUARTER') + getPoints('ADVANCE_SEMI') +
            getPoints('REACH_FINAL') + getPoints('CHAMPION');
        const participant = team.participant;
        if (!participant)
            return { team, ownerName: 'Sin dueño', pointsGained: 0, newOwnerRank: 0, message: 'Este equipo no tiene dueño asignado.' };
        const hypotheticalTotal = participant.totalPoints + pointsGained;
        const allParticipants = await this.prisma.participant.findMany({ where: { tournamentId } });
        const newRank = allParticipants.filter(p => p.totalPoints > hypotheticalTotal).length + 1;
        return {
            team,
            ownerName: participant.alias || participant.name,
            pointsGained,
            newOwnerRank: newRank,
            message: `Si ${team.name} se corona campeón, ${participant.alias || participant.name} ganaría ${pointsGained} puntos y quedaría en el lugar ${newRank}.`,
        };
    }
};
exports.SimulatorService = SimulatorService;
exports.SimulatorService = SimulatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SimulatorService);
//# sourceMappingURL=simulator.service.js.map
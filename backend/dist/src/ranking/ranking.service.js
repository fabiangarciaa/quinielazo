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
exports.RankingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RankingService = class RankingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRanking(tournamentId) {
        const participants = await this.prisma.participant.findMany({
            where: { tournamentId },
            include: {
                teams: true,
                scores: { orderBy: { earnedAt: 'desc' }, take: 20 },
            },
        });
        const entries = participants.map(p => {
            const aliveTeams = p.teams.filter(t => t.status === 'ACTIVE').length;
            const hasChampion = p.teams.some(t => t.status === 'CHAMPION');
            const totalWins = p.teams.reduce((acc, t) => acc + t.wins, 0);
            const totalGoalDiff = p.teams.reduce((acc, t) => acc + (t.goalsFor - t.goalsAgainst), 0);
            return {
                participantId: p.id,
                participantName: p.name,
                alias: p.alias,
                avatarUrl: p.avatarUrl,
                rank: p.currentRank,
                prevRank: p.prevRank,
                totalPoints: p.totalPoints,
                aliveTeams,
                eliminatedTeams: p.teams.length - aliveTeams,
                hasChampion,
                totalWins,
                totalGoalDiff,
                trend: p.currentRank < p.prevRank ? 'up' : p.currentRank > p.prevRank ? 'down' : 'same',
                pointsBreakdown: p.scores.map(s => ({ reason: s.reason, points: s.pointsEarned, earnedAt: s.earnedAt })),
            };
        });
        return entries.sort((a, b) => a.rank - b.rank);
    }
    async recalculateRanking(tournamentId) {
        const participants = await this.prisma.participant.findMany({
            where: { tournamentId },
            include: { teams: true },
        });
        const sorted = participants.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints)
                return b.totalPoints - a.totalPoints;
            const aAlive = a.teams.filter(t => t.status === 'ACTIVE').length;
            const bAlive = b.teams.filter(t => t.status === 'ACTIVE').length;
            if (bAlive !== aAlive)
                return bAlive - aAlive;
            const aChamp = a.teams.some(t => t.status === 'CHAMPION') ? 1 : 0;
            const bChamp = b.teams.some(t => t.status === 'CHAMPION') ? 1 : 0;
            if (bChamp !== aChamp)
                return bChamp - aChamp;
            const aWins = a.teams.reduce((acc, t) => acc + t.wins, 0);
            const bWins = b.teams.reduce((acc, t) => acc + t.wins, 0);
            return bWins - aWins;
        });
        for (let i = 0; i < sorted.length; i++) {
            const newRank = i + 1;
            await this.prisma.participant.update({
                where: { id: sorted[i].id },
                data: { prevRank: sorted[i].currentRank, currentRank: newRank },
            });
        }
        return this.getRanking(tournamentId);
    }
    async saveRankingSnapshot(tournamentId) {
        const participants = await this.prisma.participant.findMany({
            where: { tournamentId },
            include: { teams: true },
        });
        const snapshots = participants.map(p => ({
            tournamentId,
            participantId: p.id,
            rank: p.currentRank,
            totalPoints: p.totalPoints,
            aliveTeams: p.teams.filter(t => t.status === 'ACTIVE').length,
        }));
        await this.prisma.rankingHistory.createMany({ data: snapshots });
    }
    async getRankingHistory(tournamentId, participantId) {
        return this.prisma.rankingHistory.findMany({
            where: { tournamentId, ...(participantId ? { participantId } : {}) },
            include: { participant: true },
            orderBy: { snapshotAt: 'asc' },
        });
    }
};
exports.RankingService = RankingService;
exports.RankingService = RankingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RankingService);
//# sourceMappingURL=ranking.service.js.map
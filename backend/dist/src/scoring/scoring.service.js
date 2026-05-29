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
exports.ScoringService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ranking_service_1 = require("../ranking/ranking.service");
const events_gateway_1 = require("../events/events.gateway");
let ScoringService = class ScoringService {
    constructor(prisma, rankingService, eventsGateway) {
        this.prisma = prisma;
        this.rankingService = rankingService;
        this.eventsGateway = eventsGateway;
    }
    async processResult(data) {
        const match = await this.prisma.match.findUniqueOrThrow({
            where: { id: data.matchId },
            include: {
                homeTeam: { include: { participant: true } },
                awayTeam: { include: { participant: true } },
                phase: true,
            },
        });
        const goalDiff = Math.abs(data.homeGoals - data.awayGoals);
        const isThrashing = goalDiff >= 3;
        const homeWon = data.homeGoals > data.awayGoals;
        const awayWon = data.awayGoals > data.homeGoals;
        const isDraw = data.homeGoals === data.awayGoals;
        const homeCleanSheet = data.awayGoals === 0;
        const awayCleanSheet = data.homeGoals === 0;
        const winnerTeamId = homeWon ? match.homeTeamId : awayWon ? match.awayTeamId : null;
        const rankingBefore = await this.rankingService.getRanking(match.tournamentId);
        const result = await this.prisma.result.create({
            data: {
                matchId: data.matchId,
                homeGoals: data.homeGoals,
                awayGoals: data.awayGoals,
                winnerTeamId,
                hadPenalties: data.hadPenalties || false,
                homeCleanSheet,
                awayCleanSheet,
                isThrashing,
                advancingTeamId: data.advancingTeamId || winnerTeamId,
            },
        });
        await this.updateTeamStats(match, data, homeWon, awayWon, isDraw, homeCleanSheet, awayCleanSheet, isThrashing);
        const rules = await this.prisma.scoringRule.findMany({
            where: { tournamentId: match.tournamentId, isActive: true },
        });
        const pointsGenerated = [];
        for (const [teamId, isWinner, isHome] of [
            [match.homeTeamId, homeWon, true],
            [match.awayTeamId, awayWon, false],
        ]) {
            const team = isHome ? match.homeTeam : match.awayTeam;
            if (!team.participantId)
                continue;
            const teamPoints = this.calculateTeamPoints({
                rules,
                phase: match.phase,
                isWinner,
                isDraw,
                cleanSheet: isHome ? homeCleanSheet : awayCleanSheet,
                isThrashing: isThrashing && isWinner,
                advancing: data.advancingTeamId === teamId,
            });
            for (const { points, reason, eventType } of teamPoints) {
                if (points === 0)
                    continue;
                const rule = rules.find(r => r.eventType === eventType);
                pointsGenerated.push({
                    participantId: team.participantId,
                    teamId,
                    points,
                    reason,
                    ruleId: rule?.id || '',
                });
            }
        }
        for (const p of pointsGenerated) {
            await this.prisma.participantScore.create({
                data: {
                    participantId: p.participantId,
                    tournamentId: match.tournamentId,
                    resultId: result.id,
                    scoringRuleId: p.ruleId || null,
                    teamId: p.teamId,
                    pointsEarned: p.points,
                    reason: p.reason,
                },
            });
            await this.prisma.participant.update({
                where: { id: p.participantId },
                data: { totalPoints: { increment: p.points } },
            });
        }
        if (data.advancingTeamId) {
            const eliminatedTeamId = data.advancingTeamId === match.homeTeamId
                ? match.awayTeamId : match.homeTeamId;
            await this.prisma.team.update({
                where: { id: eliminatedTeamId },
                data: { status: 'ELIMINATED' },
            });
        }
        await this.prisma.match.update({
            where: { id: data.matchId },
            data: { status: 'FINISHED' },
        });
        const rankingAfter = await this.rankingService.recalculateRanking(match.tournamentId);
        await this.rankingService.saveRankingSnapshot(match.tournamentId);
        const summary = this.generateSummary(match, data, pointsGenerated, rankingBefore, rankingAfter);
        this.eventsGateway.emitRankingUpdate(match.tournamentId, {
            result,
            pointsGenerated,
            rankingAfter,
            summary,
        });
        return { result, pointsGenerated, rankingBefore, rankingAfter, summary };
    }
    calculateTeamPoints(params) {
        const { rules, phase, isWinner, isDraw, cleanSheet, isThrashing, advancing } = params;
        const results = [];
        const getPoints = (eventType) => rules.find(r => r.eventType === eventType)?.points || 0;
        if (phase.type === 'GROUP_STAGE') {
            if (isWinner) {
                const pts = getPoints('WIN_GROUP');
                results.push({ points: pts, reason: `Victoria en fase de grupos (+${pts})`, eventType: 'WIN_GROUP' });
            }
            else if (isDraw) {
                const pts = getPoints('DRAW_GROUP');
                results.push({ points: pts, reason: `Empate en fase de grupos (+${pts})`, eventType: 'DRAW_GROUP' });
            }
        }
        const advanceMap = {
            ROUND_OF_32: 'ADVANCE_ROUND_OF_32',
            ROUND_OF_16: 'ADVANCE_ROUND_OF_16',
            QUARTER_FINAL: 'ADVANCE_QUARTER',
            SEMI_FINAL: 'ADVANCE_SEMI',
            FINAL: 'REACH_FINAL',
        };
        if (advancing && advanceMap[phase.type]) {
            const eventType = advanceMap[phase.type];
            const pts = getPoints(eventType);
            results.push({ points: pts, reason: `Clasifica a siguiente fase (+${pts})`, eventType });
        }
        if (cleanSheet && (isWinner || isDraw)) {
            const pts = getPoints('CLEAN_SHEET');
            results.push({ points: pts, reason: `Portería en cero (+${pts})`, eventType: 'CLEAN_SHEET' });
        }
        if (isThrashing) {
            const pts = getPoints('THRASHING_WIN');
            results.push({ points: pts, reason: `Goleada por 3+ goles (+${pts})`, eventType: 'THRASHING_WIN' });
        }
        return results;
    }
    async updateTeamStats(match, data, homeWon, awayWon, isDraw, homeClean, awayClean, isThrashing) {
        const homeUpdate = {
            matchesPlayed: { increment: 1 },
            goalsFor: { increment: data.homeGoals },
            goalsAgainst: { increment: data.awayGoals },
            ...(homeWon ? { wins: { increment: 1 } } : {}),
            ...(awayWon ? { losses: { increment: 1 } } : {}),
            ...(isDraw ? { draws: { increment: 1 } } : {}),
            ...(homeClean ? { cleanSheets: { increment: 1 } } : {}),
            ...(isThrashing && homeWon ? { thrashings: { increment: 1 } } : {}),
        };
        const awayUpdate = {
            matchesPlayed: { increment: 1 },
            goalsFor: { increment: data.awayGoals },
            goalsAgainst: { increment: data.homeGoals },
            ...(awayWon ? { wins: { increment: 1 } } : {}),
            ...(homeWon ? { losses: { increment: 1 } } : {}),
            ...(isDraw ? { draws: { increment: 1 } } : {}),
            ...(awayClean ? { cleanSheets: { increment: 1 } } : {}),
            ...(isThrashing && awayWon ? { thrashings: { increment: 1 } } : {}),
        };
        await Promise.all([
            this.prisma.team.update({ where: { id: match.homeTeamId }, data: homeUpdate }),
            this.prisma.team.update({ where: { id: match.awayTeamId }, data: awayUpdate }),
        ]);
    }
    generateSummary(match, data, points, before, after) {
        const totalByParticipant = new Map();
        for (const p of points) {
            totalByParticipant.set(p.participantId, (totalByParticipant.get(p.participantId) || 0) + p.points);
        }
        const lines = [`${match.homeTeam.name} ${data.homeGoals} - ${data.awayGoals} ${match.awayTeam.name}.`];
        for (const [participantId, total] of totalByParticipant) {
            const participant = after.find(r => r.participantId === participantId);
            const beforeRank = before.find(r => r.participantId === participantId)?.rank;
            const afterRank = participant?.rank;
            if (!participant)
                continue;
            lines.push(`${participant.participantName} suma ${total} puntos${beforeRank !== afterRank ? ` y ${afterRank < beforeRank ? 'sube' : 'baja'} al lugar ${afterRank}` : ''}.`);
        }
        return lines.join(' ');
    }
};
exports.ScoringService = ScoringService;
exports.ScoringService = ScoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ranking_service_1.RankingService,
        events_gateway_1.EventsGateway])
], ScoringService);
//# sourceMappingURL=scoring.service.js.map
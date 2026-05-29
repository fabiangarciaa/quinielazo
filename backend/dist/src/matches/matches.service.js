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
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const scoring_service_1 = require("../scoring/scoring.service");
let MatchesService = class MatchesService {
    constructor(prisma, scoring) {
        this.prisma = prisma;
        this.scoring = scoring;
    }
    findByTournament(tournamentId, phaseId) {
        return this.prisma.match.findMany({
            where: { tournamentId, ...(phaseId ? { phaseId } : {}) },
            include: {
                homeTeam: { include: { participant: { select: { id: true, name: true, alias: true } } } },
                awayTeam: { include: { participant: { select: { id: true, name: true, alias: true } } } },
                phase: true,
                result: true,
            },
            orderBy: [{ status: 'asc' }, { matchDate: 'asc' }],
        });
    }
    findOne(id) {
        return this.prisma.match.findUniqueOrThrow({
            where: { id },
            include: {
                homeTeam: { include: { participant: true } },
                awayTeam: { include: { participant: true } },
                phase: true,
                result: true,
            },
        });
    }
    create(data) {
        return this.prisma.match.create({
            data: { ...data, matchDate: data.matchDate ? new Date(data.matchDate) : undefined },
            include: { homeTeam: true, awayTeam: true, phase: true },
        });
    }
    async createBulk(tournamentId, phaseId, matchups) {
        const data = matchups.map(m => ({
            tournamentId,
            phaseId,
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
            matchDate: m.matchDate ? new Date(m.matchDate) : undefined,
        }));
        await this.prisma.match.createMany({ data });
        return this.findByTournament(tournamentId, phaseId);
    }
    update(id, data) {
        return this.prisma.match.update({
            where: { id },
            data: { ...data, matchDate: data.matchDate ? new Date(data.matchDate) : undefined },
        });
    }
    delete(id) {
        return this.prisma.match.delete({ where: { id } });
    }
    async recordResult(matchId, data) {
        return this.scoring.processResult({ matchId, ...data });
    }
    async correctResult(matchId, data) {
        const existingResult = await this.prisma.result.findUnique({ where: { matchId } });
        if (existingResult) {
            const scores = await this.prisma.participantScore.findMany({ where: { resultId: existingResult.id } });
            for (const score of scores) {
                await this.prisma.participant.update({
                    where: { id: score.participantId },
                    data: { totalPoints: { decrement: score.pointsEarned } },
                });
            }
            await this.prisma.participantScore.deleteMany({ where: { resultId: existingResult.id } });
            await this.prisma.teamScore.deleteMany({ where: { resultId: existingResult.id } });
            await this.prisma.result.delete({ where: { id: existingResult.id } });
            await this.prisma.match.update({ where: { id: matchId }, data: { status: 'SCHEDULED' } });
        }
        return this.scoring.processResult({ matchId, ...data });
    }
};
exports.MatchesService = MatchesService;
exports.MatchesService = MatchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, scoring_service_1.ScoringService])
], MatchesService);
//# sourceMappingURL=matches.service.js.map
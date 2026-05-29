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
exports.DrawsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DrawsService = class DrawsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async executePotsDrawl(tournamentId) {
        const [participants, pots] = await Promise.all([
            this.prisma.participant.findMany({ where: { tournamentId } }),
            this.prisma.pot.findMany({
                where: { tournamentId },
                include: { teams: { where: { participantId: null } } },
                orderBy: { level: 'asc' },
            }),
        ]);
        if (participants.length === 0)
            throw new common_1.BadRequestException('No hay participantes');
        if (pots.length === 0)
            throw new common_1.BadRequestException('No hay bombos configurados');
        const assignments = new Map(participants.map(p => [p.id, []]));
        for (const pot of pots) {
            const teams = this.shuffle([...pot.teams]);
            participants.forEach((participant, idx) => {
                const team = teams[idx % teams.length];
                if (team)
                    assignments.get(participant.id).push(team.id);
            });
        }
        return this.applyAndSaveAssignments(tournamentId, assignments, 'POTS');
    }
    async executeSnakeDraft(tournamentId, roundsPerParticipant = 8) {
        const [participants, teams] = await Promise.all([
            this.prisma.participant.findMany({ where: { tournamentId } }),
            this.prisma.team.findMany({
                where: { tournamentId, participantId: null },
                orderBy: { strength: 'desc' },
            }),
        ]);
        const assignments = new Map(participants.map(p => [p.id, []]));
        const availableTeams = [...teams];
        let pickOrder = [...participants.map(p => p.id)];
        for (let round = 0; round < roundsPerParticipant; round++) {
            const order = round % 2 === 0 ? pickOrder : [...pickOrder].reverse();
            for (const participantId of order) {
                if (availableTeams.length === 0)
                    break;
                const team = availableTeams.shift();
                assignments.get(participantId).push(team.id);
            }
        }
        return this.applyAndSaveAssignments(tournamentId, assignments, 'SNAKE_DRAFT');
    }
    async executeBalancedAuto(tournamentId, teamsPerParticipant) {
        const [participants, teams] = await Promise.all([
            this.prisma.participant.findMany({ where: { tournamentId } }),
            this.prisma.team.findMany({
                where: { tournamentId, participantId: null },
                orderBy: { strength: 'desc' },
            }),
        ]);
        const assignments = new Map(participants.map(p => [p.id, []]));
        const strengthTotals = new Map(participants.map(p => [p.id, 0]));
        const shuffledTeams = this.shuffle([...teams]);
        for (const team of shuffledTeams) {
            if ([...assignments.values()].every(arr => arr.length >= teamsPerParticipant))
                break;
            const eligibleParticipants = participants.filter(p => assignments.get(p.id).length < teamsPerParticipant);
            eligibleParticipants.sort((a, b) => strengthTotals.get(a.id) - strengthTotals.get(b.id));
            const target = eligibleParticipants[0];
            if (!target)
                continue;
            assignments.get(target.id).push(team.id);
            strengthTotals.set(target.id, strengthTotals.get(target.id) + team.strength);
        }
        return this.applyAndSaveAssignments(tournamentId, assignments, 'BALANCED_AUTO');
    }
    async calculatePotProposal(tournamentId) {
        const tournament = await this.prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
        const teams = await this.prisma.team.findMany({
            where: { tournamentId },
            orderBy: { strength: 'desc' },
        });
        const numPots = tournament.participantCount;
        const teamsPerPot = Math.floor(teams.length / numPots);
        const teamsPerParticipant = numPots;
        const pots = [];
        for (let i = 0; i < numPots; i++) {
            const slice = teams.slice(i * teamsPerPot, (i + 1) * teamsPerPot);
            pots.push({
                level: i + 1,
                name: `Bombo ${i + 1}`,
                strengthMin: Math.min(...slice.map(t => t.strength)),
                strengthMax: Math.max(...slice.map(t => t.strength)),
                teams: slice,
            });
        }
        return { pots, teamsPerParticipant };
    }
    async applyAndSaveAssignments(tournamentId, assignments, method) {
        const participants = await this.prisma.participant.findMany({
            where: { tournamentId },
            include: { teams: true },
        });
        for (const [participantId, teamIds] of assignments) {
            await this.prisma.team.updateMany({
                where: { id: { in: teamIds } },
                data: { participantId },
            });
        }
        const teams = await this.prisma.team.findMany({
            where: { tournamentId, participantId: { not: null } },
            include: { pot: true },
        });
        const drawAssignments = [];
        for (const [participantId, teamIds] of assignments) {
            const participant = participants.find(p => p.id === participantId);
            const assignedTeams = teams
                .filter(t => teamIds.includes(t.id))
                .map(t => ({ id: t.id, name: t.name, strength: t.strength, potName: t.pot?.name || 'Sin bombo' }));
            drawAssignments.push({
                participantId,
                participantName: participant.alias || participant.name,
                teams: assignedTeams,
                totalStrength: assignedTeams.reduce((acc, t) => acc + t.strength, 0),
            });
        }
        const strengths = drawAssignments.map(a => a.totalStrength);
        const avg = strengths.reduce((a, b) => a + b, 0) / strengths.length;
        const stdDev = Math.sqrt(strengths.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / strengths.length);
        const balanceScore = Math.max(0, 100 - (stdDev / avg) * 100);
        const balanceLabel = balanceScore >= 80 ? 'Muy equilibrado' :
            balanceScore >= 50 ? 'Medianamente equilibrado' : 'Desbalanceado';
        await this.prisma.draw.create({
            data: {
                tournamentId,
                method: method,
                status: 'COMPLETED',
                balanceScore,
                assignments: JSON.parse(JSON.stringify(drawAssignments)),
                executedAt: new Date(),
            },
        });
        return {
            assignments: drawAssignments,
            balanceScore,
            balanceLabel,
            strengthStats: { min: Math.min(...strengths), max: Math.max(...strengths), avg, stdDev },
        };
    }
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};
exports.DrawsService = DrawsService;
exports.DrawsService = DrawsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DrawsService);
//# sourceMappingURL=draws.service.js.map
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
exports.ParticipantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let ParticipantsService = class ParticipantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByTournament(tournamentId) {
        return this.prisma.participant.findMany({
            where: { tournamentId },
            include: {
                teams: { orderBy: { strength: 'desc' } },
                scores: { orderBy: { earnedAt: 'desc' }, take: 10 },
                user: { select: { id: true, name: true, email: true } },
                _count: { select: { scores: true } },
            },
            orderBy: { currentRank: 'asc' },
        });
    }
    findOne(id) {
        return this.prisma.participant.findUniqueOrThrow({
            where: { id },
            include: {
                teams: true,
                scores: { orderBy: { earnedAt: 'desc' }, take: 50 },
                rankingHistory: { orderBy: { snapshotAt: 'asc' } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
    }
    async create(data) {
        const tournament = await this.prisma.tournament.findUniqueOrThrow({
            where: { id: data.tournamentId },
        });
        const count = await this.prisma.participant.count({
            where: { tournamentId: data.tournamentId },
        });
        if (count >= tournament.participantCount) {
            throw new common_1.BadRequestException(`El torneo ya tiene el máximo de ${tournament.participantCount} participantes`);
        }
        let userId = data.userId;
        if (data.createUser && data.email && data.password) {
            const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
            if (exists) {
                userId = exists.id;
            }
            else {
                const hash = await bcrypt.hash(data.password, 10);
                const user = await this.prisma.user.create({
                    data: {
                        name: data.alias || data.name,
                        email: data.email,
                        passwordHash: hash,
                        role: 'USER',
                    },
                });
                userId = user.id;
            }
        }
        return this.prisma.participant.create({
            data: {
                tournamentId: data.tournamentId,
                name: data.name,
                alias: data.alias,
                userId,
            },
            include: { teams: true, user: { select: { id: true, name: true, email: true } } },
        });
    }
    update(id, data) {
        return this.prisma.participant.update({ where: { id }, data });
    }
    async delete(id) {
        await this.prisma.team.updateMany({ where: { participantId: id }, data: { participantId: null } });
        return this.prisma.participant.delete({ where: { id } });
    }
    getScoreHistory(participantId) {
        return this.prisma.participantScore.findMany({
            where: { participantId },
            include: {
                result: {
                    include: {
                        match: {
                            include: { homeTeam: true, awayTeam: true, phase: true },
                        },
                    },
                },
            },
            orderBy: { earnedAt: 'desc' },
        });
    }
    async generateCredentials(tournamentId) {
        const participants = await this.prisma.participant.findMany({
            where: { tournamentId },
            include: { user: true },
        });
        const results = [];
        for (const p of participants) {
            if (p.user) {
                results.push({
                    participantId: p.id,
                    name: p.alias || p.name,
                    email: p.user.email,
                    alreadyHadUser: true,
                    password: null,
                });
                continue;
            }
            const baseName = (p.alias || p.name)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '.');
            const email = `${baseName}@quinielazo.mx`;
            const password = Math.random().toString(36).slice(-8);
            const exists = await this.prisma.user.findUnique({ where: { email } });
            const finalEmail = exists ? `${baseName}.${p.id.slice(0, 4)}@quinielazo.mx` : email;
            const hash = await bcrypt.hash(password, 10);
            const user = await this.prisma.user.create({
                data: { name: p.alias || p.name, email: finalEmail, passwordHash: hash, role: 'USER' },
            });
            await this.prisma.participant.update({ where: { id: p.id }, data: { userId: user.id } });
            results.push({
                participantId: p.id,
                name: p.alias || p.name,
                email: finalEmail,
                password,
                alreadyHadUser: false,
            });
        }
        return results;
    }
};
exports.ParticipantsService = ParticipantsService;
exports.ParticipantsService = ParticipantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ParticipantsService);
//# sourceMappingURL=participants.service.js.map
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
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const XLSX = require("xlsx");
let ExportService = class ExportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportRankingExcel(tournamentId) {
        const participants = await this.prisma.participant.findMany({
            where: { tournamentId },
            include: { teams: true },
            orderBy: { currentRank: 'asc' },
        });
        const rows = participants.map(p => ({
            Posición: p.currentRank,
            Participante: p.alias || p.name,
            Puntos: p.totalPoints,
            'Equipos vivos': p.teams.filter(t => t.status === 'ACTIVE').length,
            'Equipos eliminados': p.teams.filter(t => t.status === 'ELIMINATED').length,
            Equipos: p.teams.map(t => t.name).join(', '),
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ranking');
        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
    async exportRankingCsv(tournamentId) {
        const participants = await this.prisma.participant.findMany({
            where: { tournamentId },
            include: { teams: true },
            orderBy: { currentRank: 'asc' },
        });
        const header = 'Posición,Participante,Puntos,Equipos vivos,Equipos eliminados\n';
        const rows = participants.map(p => `${p.currentRank},"${p.alias || p.name}",${p.totalPoints},${p.teams.filter(t => t.status === 'ACTIVE').length},${p.teams.filter(t => t.status === 'ELIMINATED').length}`).join('\n');
        return header + rows;
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportService);
//# sourceMappingURL=export.service.js.map
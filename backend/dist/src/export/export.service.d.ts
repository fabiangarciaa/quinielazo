import { PrismaService } from '../prisma/prisma.service';
export declare class ExportService {
    private prisma;
    constructor(prisma: PrismaService);
    exportRankingExcel(tournamentId: string): Promise<Buffer>;
    exportRankingCsv(tournamentId: string): Promise<string>;
}

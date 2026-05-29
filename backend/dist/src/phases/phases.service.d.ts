import { PrismaService } from '../prisma/prisma.service';
export declare class PhasesService {
    private prisma;
    constructor(prisma: PrismaService);
    findByTournament(tournamentId: string): import(".prisma/client").Prisma.PrismaPromise<({
        _count: {
            matches: number;
        };
    } & {
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.PhaseType;
        isActive: boolean;
        tournamentId: string;
        roundNumber: number;
        startDate: Date | null;
        endDate: Date | null;
    })[]>;
    create(data: {
        tournamentId: string;
        name: string;
        type: any;
        roundNumber: number;
        startDate?: string;
    }): import(".prisma/client").Prisma.Prisma__TournamentPhaseClient<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.PhaseType;
        isActive: boolean;
        tournamentId: string;
        roundNumber: number;
        startDate: Date | null;
        endDate: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: {
        name?: string;
        isActive?: boolean;
        startDate?: string;
    }): import(".prisma/client").Prisma.Prisma__TournamentPhaseClient<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.PhaseType;
        isActive: boolean;
        tournamentId: string;
        roundNumber: number;
        startDate: Date | null;
        endDate: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    setActive(id: string): Promise<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.PhaseType;
        isActive: boolean;
        tournamentId: string;
        roundNumber: number;
        startDate: Date | null;
        endDate: Date | null;
    }>;
    delete(id: string): import(".prisma/client").Prisma.Prisma__TournamentPhaseClient<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.PhaseType;
        isActive: boolean;
        tournamentId: string;
        roundNumber: number;
        startDate: Date | null;
        endDate: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    closePhase(phaseId: string, advancingTeamIds: string[]): Promise<{
        phaseId: string;
        phaseName: string;
        eliminated: number;
        advancing: number;
        message: string;
    }>;
    getTeamsInPhase(phaseId: string): Promise<any[]>;
}

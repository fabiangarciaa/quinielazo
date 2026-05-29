import { PhasesService } from './phases.service';
export declare class PhasesController {
    private svc;
    constructor(svc: PhasesService);
    findAll(tid: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    create(body: any): import(".prisma/client").Prisma.Prisma__TournamentPhaseClient<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.PhaseType;
        isActive: boolean;
        tournamentId: string;
        roundNumber: number;
        startDate: Date | null;
        endDate: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, body: any): import(".prisma/client").Prisma.Prisma__TournamentPhaseClient<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.PhaseType;
        isActive: boolean;
        tournamentId: string;
        roundNumber: number;
        startDate: Date | null;
        endDate: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    activate(id: string): Promise<{
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
    getTeams(id: string): Promise<any[]>;
    closePhase(id: string, body: {
        advancingTeamIds: string[];
    }): Promise<{
        phaseId: string;
        phaseName: string;
        eliminated: number;
        advancing: number;
        message: string;
    }>;
}

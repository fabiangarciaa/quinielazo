import { PrismaService } from '../prisma/prisma.service';
export interface SimulationScenario {
    participantId: string;
    participantName: string;
    currentPoints: number;
    maxPossiblePoints: number;
    bestCaseRank: number;
    aliveTeams: number;
    canOvertake: Array<{
        targetName: string;
        pointsNeeded: number;
        feasible: boolean;
    }>;
    criticalTeams: Array<{
        teamName: string;
        pointsIfChampion: number;
    }>;
}
export declare class SimulatorService {
    private prisma;
    constructor(prisma: PrismaService);
    simulate(tournamentId: string): Promise<SimulationScenario[]>;
    simulateTeamWin(tournamentId: string, teamId: string): Promise<{
        team: any;
        ownerName: string;
        pointsGained: number;
        newOwnerRank: number;
        message: string;
    }>;
}

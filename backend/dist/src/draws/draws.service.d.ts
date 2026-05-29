import { PrismaService } from '../prisma/prisma.service';
export interface DrawAssignment {
    participantId: string;
    participantName: string;
    teams: Array<{
        id: string;
        name: string;
        strength: number;
        potName: string;
    }>;
    totalStrength: number;
}
export interface DrawResult {
    assignments: DrawAssignment[];
    balanceScore: number;
    balanceLabel: 'Muy equilibrado' | 'Medianamente equilibrado' | 'Desbalanceado';
    strengthStats: {
        min: number;
        max: number;
        avg: number;
        stdDev: number;
    };
}
export declare class DrawsService {
    private prisma;
    constructor(prisma: PrismaService);
    executePotsDrawl(tournamentId: string): Promise<DrawResult>;
    executeSnakeDraft(tournamentId: string, roundsPerParticipant?: number): Promise<DrawResult>;
    executeBalancedAuto(tournamentId: string, teamsPerParticipant: number): Promise<DrawResult>;
    calculatePotProposal(tournamentId: string): Promise<{
        pots: Array<{
            level: number;
            name: string;
            strengthMin: number;
            strengthMax: number;
            teams: any[];
        }>;
        teamsPerParticipant: number;
    }>;
    private applyAndSaveAssignments;
    private shuffle;
}

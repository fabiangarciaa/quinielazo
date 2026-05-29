import { PrismaService } from '../prisma/prisma.service';
export interface RankingEntry {
    participantId: string;
    participantName: string;
    alias: string | null;
    avatarUrl: string | null;
    rank: number;
    prevRank: number;
    totalPoints: number;
    aliveTeams: number;
    eliminatedTeams: number;
    hasChampion: boolean;
    totalWins: number;
    totalGoalDiff: number;
    trend: 'up' | 'down' | 'same';
    pointsBreakdown: Array<{
        reason: string;
        points: number;
        earnedAt: Date;
    }>;
}
export declare class RankingService {
    private prisma;
    constructor(prisma: PrismaService);
    getRanking(tournamentId: string): Promise<RankingEntry[]>;
    recalculateRanking(tournamentId: string): Promise<RankingEntry[]>;
    saveRankingSnapshot(tournamentId: string): Promise<void>;
    getRankingHistory(tournamentId: string, participantId?: string): Promise<({
        participant: {
            id: string;
            name: string;
            avatarUrl: string | null;
            tournamentId: string;
            userId: string | null;
            alias: string | null;
            totalPoints: number;
            currentRank: number;
            prevRank: number;
            joinedAt: Date;
        };
    } & {
        id: string;
        tournamentId: string;
        participantId: string;
        totalPoints: number;
        snapshotAt: Date;
        rank: number;
        aliveTeams: number;
    })[]>;
}

import { PrismaService } from '../prisma/prisma.service';
export declare class ParticipantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findByTournament(tournamentId: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            name: string;
            email: string;
        };
        teams: {
            id: string;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TeamStatus;
            draws: number;
            tournamentId: string;
            country: string | null;
            shieldUrl: string | null;
            strength: number;
            matchesPlayed: number;
            wins: number;
            losses: number;
            goalsFor: number;
            goalsAgainst: number;
            cleanSheets: number;
            thrashings: number;
            phaseReached: string | null;
            participantId: string | null;
            potId: string | null;
        }[];
        scores: {
            id: string;
            tournamentId: string;
            participantId: string;
            earnedAt: Date;
            resultId: string | null;
            scoringRuleId: string | null;
            teamId: string | null;
            pointsEarned: number;
            reason: string;
        }[];
        _count: {
            scores: number;
        };
    } & {
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
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__ParticipantClient<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        teams: {
            id: string;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TeamStatus;
            draws: number;
            tournamentId: string;
            country: string | null;
            shieldUrl: string | null;
            strength: number;
            matchesPlayed: number;
            wins: number;
            losses: number;
            goalsFor: number;
            goalsAgainst: number;
            cleanSheets: number;
            thrashings: number;
            phaseReached: string | null;
            participantId: string | null;
            potId: string | null;
        }[];
        rankingHistory: {
            id: string;
            tournamentId: string;
            participantId: string;
            totalPoints: number;
            snapshotAt: Date;
            rank: number;
            aliveTeams: number;
        }[];
        scores: {
            id: string;
            tournamentId: string;
            participantId: string;
            earnedAt: Date;
            resultId: string | null;
            scoringRuleId: string | null;
            teamId: string | null;
            pointsEarned: number;
            reason: string;
        }[];
    } & {
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: {
        tournamentId: string;
        name: string;
        alias?: string;
        userId?: string;
        createUser?: boolean;
        email?: string;
        password?: string;
    }): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        teams: {
            id: string;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TeamStatus;
            draws: number;
            tournamentId: string;
            country: string | null;
            shieldUrl: string | null;
            strength: number;
            matchesPlayed: number;
            wins: number;
            losses: number;
            goalsFor: number;
            goalsAgainst: number;
            cleanSheets: number;
            thrashings: number;
            phaseReached: string | null;
            participantId: string | null;
            potId: string | null;
        }[];
    } & {
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
    }>;
    update(id: string, data: {
        name?: string;
        alias?: string;
    }): import(".prisma/client").Prisma.Prisma__ParticipantClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    delete(id: string): Promise<{
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
    }>;
    getScoreHistory(participantId: string): import(".prisma/client").Prisma.PrismaPromise<({
        result: {
            match: {
                phase: {
                    id: string;
                    name: string;
                    type: import(".prisma/client").$Enums.PhaseType;
                    isActive: boolean;
                    tournamentId: string;
                    roundNumber: number;
                    startDate: Date | null;
                    endDate: Date | null;
                };
                homeTeam: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    status: import(".prisma/client").$Enums.TeamStatus;
                    draws: number;
                    tournamentId: string;
                    country: string | null;
                    shieldUrl: string | null;
                    strength: number;
                    matchesPlayed: number;
                    wins: number;
                    losses: number;
                    goalsFor: number;
                    goalsAgainst: number;
                    cleanSheets: number;
                    thrashings: number;
                    phaseReached: string | null;
                    participantId: string | null;
                    potId: string | null;
                };
                awayTeam: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    status: import(".prisma/client").$Enums.TeamStatus;
                    draws: number;
                    tournamentId: string;
                    country: string | null;
                    shieldUrl: string | null;
                    strength: number;
                    matchesPlayed: number;
                    wins: number;
                    losses: number;
                    goalsFor: number;
                    goalsAgainst: number;
                    cleanSheets: number;
                    thrashings: number;
                    phaseReached: string | null;
                    participantId: string | null;
                    potId: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.MatchStatus;
                tournamentId: string;
                matchDate: Date | null;
                notes: string | null;
                phaseId: string;
                homeTeamId: string;
                awayTeamId: string;
            };
        } & {
            id: string;
            matchId: string;
            homeGoals: number;
            awayGoals: number;
            winnerTeamId: string | null;
            hadPenalties: boolean;
            homeCleanSheet: boolean;
            awayCleanSheet: boolean;
            isThrashing: boolean;
            advancingTeamId: string | null;
            recordedAt: Date;
            recordedBy: string | null;
        };
    } & {
        id: string;
        tournamentId: string;
        participantId: string;
        earnedAt: Date;
        resultId: string | null;
        scoringRuleId: string | null;
        teamId: string | null;
        pointsEarned: number;
        reason: string;
    })[]>;
    generateCredentials(tournamentId: string): Promise<any[]>;
}

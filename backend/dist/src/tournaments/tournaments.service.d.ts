import { PrismaService } from '../prisma/prisma.service';
export declare class TournamentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        _count: {
            participants: number;
            teams: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TournamentType;
        season: string;
        teamCount: number;
        participantCount: number;
        competitionSystem: string;
        status: import(".prisma/client").$Enums.TournamentStatus;
        scoringConfig: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__TournamentClient<{
        participants: ({
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
        })[];
        phases: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.PhaseType;
            isActive: boolean;
            tournamentId: string;
            roundNumber: number;
            startDate: Date | null;
            endDate: Date | null;
        }[];
        scoringRules: {
            id: string;
            eventType: import(".prisma/client").$Enums.ScoringEventType;
            points: number;
            isActive: boolean;
            description: string | null;
            tournamentId: string;
        }[];
        _count: {
            teams: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TournamentType;
        season: string;
        teamCount: number;
        participantCount: number;
        competitionSystem: string;
        status: import(".prisma/client").$Enums.TournamentStatus;
        scoringConfig: import("@prisma/client/runtime/library").JsonValue;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: {
        name: string;
        type: any;
        season: string;
        teamCount: number;
        participantCount: number;
        competitionSystem: string;
        scoringConfig?: any;
    }): import(".prisma/client").Prisma.Prisma__TournamentClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TournamentType;
        season: string;
        teamCount: number;
        participantCount: number;
        competitionSystem: string;
        status: import(".prisma/client").$Enums.TournamentStatus;
        scoringConfig: import("@prisma/client/runtime/library").JsonValue;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: any): import(".prisma/client").Prisma.Prisma__TournamentClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TournamentType;
        season: string;
        teamCount: number;
        participantCount: number;
        competitionSystem: string;
        status: import(".prisma/client").$Enums.TournamentStatus;
        scoringConfig: import("@prisma/client/runtime/library").JsonValue;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    updateStatus(id: string, status: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TournamentType;
        season: string;
        teamCount: number;
        participantCount: number;
        competitionSystem: string;
        status: import(".prisma/client").$Enums.TournamentStatus;
        scoringConfig: import("@prisma/client/runtime/library").JsonValue;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TournamentType;
        season: string;
        teamCount: number;
        participantCount: number;
        competitionSystem: string;
        status: import(".prisma/client").$Enums.TournamentStatus;
        scoringConfig: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getScoringRules(tournamentId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        eventType: import(".prisma/client").$Enums.ScoringEventType;
        points: number;
        isActive: boolean;
        description: string | null;
        tournamentId: string;
    }[]>;
    updateScoringRule(ruleId: string, points: number, isActive: boolean): import(".prisma/client").Prisma.Prisma__ScoringRuleClient<{
        id: string;
        eventType: import(".prisma/client").$Enums.ScoringEventType;
        points: number;
        isActive: boolean;
        description: string | null;
        tournamentId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    upsertScoringRule(tournamentId: string, eventType: string, points: number, description?: string): Promise<{
        id: string;
        eventType: import(".prisma/client").$Enums.ScoringEventType;
        points: number;
        isActive: boolean;
        description: string | null;
        tournamentId: string;
    }>;
}

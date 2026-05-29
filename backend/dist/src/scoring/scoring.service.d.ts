import { PrismaService } from '../prisma/prisma.service';
import { RankingService } from '../ranking/ranking.service';
import { EventsGateway } from '../events/events.gateway';
export interface MatchResultData {
    matchId: string;
    homeGoals: number;
    awayGoals: number;
    hadPenalties?: boolean;
    advancingTeamId?: string;
}
export declare class ScoringService {
    private prisma;
    private rankingService;
    private eventsGateway;
    constructor(prisma: PrismaService, rankingService: RankingService, eventsGateway: EventsGateway);
    processResult(data: MatchResultData): Promise<{
        result: any;
        pointsGenerated: Array<{
            participantId: string;
            points: number;
            reason: string;
        }>;
        rankingBefore: any[];
        rankingAfter: any[];
        summary: string;
    }>;
    private calculateTeamPoints;
    private updateTeamStats;
    private generateSummary;
}

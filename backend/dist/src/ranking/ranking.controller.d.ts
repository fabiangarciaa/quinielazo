import { RankingService } from './ranking.service';
export declare class RankingController {
    private svc;
    constructor(svc: RankingService);
    get(id: string): Promise<import("./ranking.service").RankingEntry[]>;
    history(id: string): Promise<({
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

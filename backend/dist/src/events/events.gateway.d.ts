import { Server, Socket } from 'socket.io';
export declare class EventsGateway {
    server: Server;
    handleJoin(data: {
        tournamentId: string;
    }, client: Socket): void;
    handleLeave(data: {
        tournamentId: string;
    }, client: Socket): void;
    emitRankingUpdate(tournamentId: string, payload: any): void;
    emitMatchResult(tournamentId: string, payload: any): void;
    emitTournamentUpdate(tournamentId: string, payload: any): void;
}

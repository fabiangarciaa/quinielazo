// src/events/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join_tournament')
  handleJoin(@MessageBody() data: { tournamentId: string }, @ConnectedSocket() client: Socket) {
    client.join(`tournament:${data.tournamentId}`);
    client.emit('joined', { message: `Conectado a torneo ${data.tournamentId}` });
  }

  @SubscribeMessage('leave_tournament')
  handleLeave(@MessageBody() data: { tournamentId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`tournament:${data.tournamentId}`);
  }

  emitRankingUpdate(tournamentId: string, payload: any) {
    this.server.to(`tournament:${tournamentId}`).emit('ranking_updated', payload);
  }

  emitMatchResult(tournamentId: string, payload: any) {
    this.server.to(`tournament:${tournamentId}`).emit('match_result', payload);
  }

  emitTournamentUpdate(tournamentId: string, payload: any) {
    this.server.to(`tournament:${tournamentId}`).emit('tournament_updated', payload);
  }
}

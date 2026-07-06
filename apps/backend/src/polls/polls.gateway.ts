import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { wsCorsOrigin } from '../common/ws-cors.util';

@WebSocketGateway({
  cors: { origin: wsCorsOrigin, credentials: true },
  namespace: '/ws',
})
export class PollsGateway {
  @WebSocketServer()
  server!: Server;

  broadcastPollUpdate(roomId: string, poll: unknown) {
    this.server.to(`room:${roomId}`).emit('poll:update', poll);
  }

  broadcastPollCreated(roomId: string, poll: unknown) {
    this.server.to(`room:${roomId}`).emit('poll:created', poll);
  }

  broadcastSystemMessage(roomId: string, message: unknown) {
    this.server.to(`room:${roomId}`).emit('message:new', message);
  }
}

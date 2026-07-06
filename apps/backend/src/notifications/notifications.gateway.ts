import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { wsCorsOrigin } from '../common/ws-cors.util';

interface AuthenticatedSocket extends Socket {
  data: { userId: string; email: string };
}

@WebSocketGateway({
  cors: { origin: wsCorsOrigin, credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('No token');
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      // Кожен користувач у власній "кімнаті" сокета, ім'я = userId
      await client.join(`user:${payload.sub}`);
    } catch (err) {
      this.logger.warn(`Notifications WS rejected: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7);
    return null;
  }
}

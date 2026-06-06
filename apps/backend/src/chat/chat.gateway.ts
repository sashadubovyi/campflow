import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { ToggleImportantDto } from './dto/toggle-important.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PresenceService } from '../presence/presence.service';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    email: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/ws',
})
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly presence: PresenceService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new Error('No token provided');
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      this.logger.log(`Client connected: ${payload.email} (${client.id})`);

      // ↓↓↓ Presence: онлайн ↓↓↓
      await this.presence.markOnline(payload.sub);
      this.server.emit('presence:online', { userId: payload.sub });
    } catch (err) {
      this.logger.warn(`Connection rejected: ${(err as Error).message}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.data?.email ?? client.id}`);
    if (!client.data?.userId) return;

    const userId = client.data.userId;

    // Сообщаем всем комнатам, в которых был сокет, что юзер вышел
    for (const room of client.rooms) {
      if (room.startsWith('room:')) {
        const roomId = room.slice(5);
        await this.chatService.touchLastSeen(userId, roomId).catch(() => {});
        client.to(room).emit('presence:leave', { userId });
      }
    }

    // ↓↓↓ Presence: офлайн ↓↓↓
    await this.presence.markOffline(userId);
    this.server.emit('presence:offline', {
      userId,
      lastSeenAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('room:join')
  async onRoomJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!data?.roomId) throw new WsException('roomId is required');
    await this.chatService.assertMembership(client.data.userId, data.roomId);
    await client.join(this.roomChannel(data.roomId));
    await this.chatService.touchLastSeen(client.data.userId, data.roomId);
    client.emit('room:joined', { roomId: data.roomId });
    client.to(this.roomChannel(data.roomId)).emit('presence:join', {
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('room:leave')
  async onRoomLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!data?.roomId) return;
    await client.leave(this.roomChannel(data.roomId));
    client.to(this.roomChannel(data.roomId)).emit('presence:leave', {
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('message:send')
  async onMessageSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const message = await this.chatService.createMessage(
      client.data.userId,
      dto.roomId,
      dto.content,
    );

    this.server.to(this.roomChannel(dto.roomId)).emit('message:new', message);
    return { ok: true, id: message.id };
  }

  @SubscribeMessage('message:delete')
  async onMessageDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: DeleteMessageDto,
  ) {
    const result = await this.chatService.deleteMessage(client.data.userId, dto.messageId, dto.roomId);
    this.server.to(this.roomChannel(dto.roomId)).emit('message:deleted', result);
    return { ok: true };
  }

  @SubscribeMessage('message:toggleImportant')
  async onToggleImportant(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: ToggleImportantDto,
  ) {
    const message = await this.chatService.toggleImportant(
      client.data.userId,
      dto.messageId,
      dto.roomId,
    );
    this.server.to(this.roomChannel(dto.roomId)).emit('message:updated', message);
    return { ok: true };
  }

  @SubscribeMessage('typing:start')
  onTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!data?.roomId) return;
    client.to(this.roomChannel(data.roomId)).emit('typing:start', {
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  onTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!data?.roomId) return;
    client.to(this.roomChannel(data.roomId)).emit('typing:stop', {
      userId: client.data.userId,
    });
  }

  private roomChannel(roomId: string) {
    return `room:${roomId}`;
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return null;
  }
}

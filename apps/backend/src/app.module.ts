import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { ChatModule } from './chat/chat.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PollsModule } from './polls/polls.module';
import { FinalPlanModule } from './final-plan/final-plan.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RoomLifecycleModule } from './room-lifecycle/room-lifecycle.module';
import { AiModule } from './ai/ai.module';
import { PresenceModule } from './presence/presence.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    ChatModule,
    PollsModule,
    FinalPlanModule,
    FinalPlanModule,
    RoomLifecycleModule,
    AiModule,
    PresenceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

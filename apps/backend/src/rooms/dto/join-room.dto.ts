import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @MinLength(6)
  @MaxLength(12)
  @Matches(/^[A-Z0-9]+$/, { message: 'Invite code must contain only A-Z and 0-9' })
  inviteCode!: string;
}

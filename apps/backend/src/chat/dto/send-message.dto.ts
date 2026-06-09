import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  roomId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  /** UUID повідомлення, на яке відповідаємо (опціонально). */
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

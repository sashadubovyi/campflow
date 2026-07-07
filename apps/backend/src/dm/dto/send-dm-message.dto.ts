import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendDmMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

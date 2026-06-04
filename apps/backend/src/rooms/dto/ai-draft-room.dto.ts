import { IsString, MinLength, MaxLength } from 'class-validator';

export class AiDraftRoomDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  prompt!: string;
}

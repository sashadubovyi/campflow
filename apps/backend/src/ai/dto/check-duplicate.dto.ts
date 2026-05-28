import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CheckDuplicateDto {
  @IsUUID()
  roomId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;
}

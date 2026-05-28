import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class GenerateChecklistDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  description!: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;
}

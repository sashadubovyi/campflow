import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInviteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

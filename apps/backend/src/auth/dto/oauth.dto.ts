import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OAuthLoginDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  idToken!: string;

  /** Apple повертає name тільки при першому логіні, окремим полем — фронт може передати. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;
}

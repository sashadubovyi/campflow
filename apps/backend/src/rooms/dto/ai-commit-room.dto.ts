import { IsString, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AiCommitPollDto {
  @IsIn(['single_choice', 'multi_choice', 'location'])
  kind!: 'single_choice' | 'multi_choice' | 'location';

  @IsString()
  question!: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsArray()
  resolvedPlaces?: {
    label: string;
    latitude: number;
    longitude: number;
    address?: string;
  }[];
}

export class AiCommitRoomDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  eventDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiCommitPollDto)
  polls!: AiCommitPollDto[];
}

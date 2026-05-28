import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AddLocationOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}

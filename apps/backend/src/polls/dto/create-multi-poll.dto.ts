import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateMultiPollOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label!: string;
}

export class CreateMultiPollDto {
  @IsUUID()
  roomId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  allowAssign?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateMultiPollOptionDto)
  options!: CreateMultiPollOptionDto[];
}

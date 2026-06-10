import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const VISIBILITY = ['public', 'contacts', 'hidden'] as const;
const GENDER = ['male', 'female', 'unspecified'] as const;
const INVITE_POLICY = ['all', 'contacts', 'none'] as const;

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string | null;
  @IsOptional() @IsEnum(['uk', 'en', 'ru']) locale?: 'uk' | 'en' | 'ru';

  // Профіль
  @IsOptional() @IsString() @MaxLength(2000) bio?: string | null;
  @IsOptional() @IsString() @MaxLength(100) city?: string | null;
  @IsOptional() @IsDateString() birthDate?: string | null;
  @IsOptional() @IsEnum(GENDER) gender?: (typeof GENDER)[number] | null;
  @IsOptional() @IsArray() @IsString({ each: true }) hobbies?: string[];
  @IsOptional() @IsString() @MaxLength(200) hobbiesCustom?: string | null;

  // Контакти
  @IsOptional() @IsString() @MaxLength(64) telegram?: string | null;
  @IsOptional() @IsString() @MaxLength(32) whatsapp?: string | null;
  @IsOptional() @IsString() @MaxLength(64) instagram?: string | null;
  @IsOptional() @IsString() @MaxLength(64) facebook?: string | null;
  @IsOptional() @IsString() @MaxLength(64) threads?: string | null;

  // Видимість контактних полів
  @IsOptional() @IsEnum(VISIBILITY) emailVisibility?: (typeof VISIBILITY)[number];
  @IsOptional() @IsEnum(VISIBILITY) phoneVisibility?: (typeof VISIBILITY)[number];
  @IsOptional() @IsEnum(VISIBILITY) telegramVisibility?: (typeof VISIBILITY)[number];
  @IsOptional() @IsEnum(VISIBILITY) whatsappVisibility?: (typeof VISIBILITY)[number];
  @IsOptional() @IsEnum(VISIBILITY) instagramVisibility?: (typeof VISIBILITY)[number];
  @IsOptional() @IsEnum(VISIBILITY) facebookVisibility?: (typeof VISIBILITY)[number];
  @IsOptional() @IsEnum(VISIBILITY) threadsVisibility?: (typeof VISIBILITY)[number];

  // Хто може запрошувати в кімнати
  @IsOptional() @IsEnum(INVITE_POLICY) inviteFrom?: (typeof INVITE_POLICY)[number];
}

import { IsUUID } from 'class-validator';

export class ToggleImportantDto {
  @IsUUID()
  messageId!: string;

  @IsUUID()
  roomId!: string;
}

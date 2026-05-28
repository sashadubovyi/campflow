import { IsOptional, IsUUID } from 'class-validator';

export class AssignOptionDto {
  // null = зняти закріплення; UUID = закріпити за конкретним юзером
  @IsOptional()
  @IsUUID()
  assignedTo?: string | null;
}

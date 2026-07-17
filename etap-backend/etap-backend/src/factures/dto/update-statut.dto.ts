import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { StatutFacture } from '@prisma/client';

export class UpdateStatutDto {
  @IsEnum(StatutFacture)
  statut: StatutFacture;

  @ValidateIf((o) => o.statut === StatutFacture.REJETEE)
  @IsString()
  @IsOptional()
  motifRejet?: string;
}

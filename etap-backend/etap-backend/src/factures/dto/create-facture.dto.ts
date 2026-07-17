import {
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeEnergie, TypeReleve } from '@prisma/client';

class LigneConsommationInputDto {
  @IsString()
  libelleTranche: string;

  @IsNumber()
  ancienIndex: number;

  @IsNumber()
  nouveauIndex: number;

  @IsNumber()
  prixUnitaire: number;

  @IsNumber()
  @IsOptional()
  tauxTVA?: number;
}

class TaxeInputDto {
  @IsString()
  libelle: string;

  @IsNumber()
  montant: number;
}

export class CreateFactureDto {
  @IsString()
  numeroFacture: string;

  @IsString()
  referenceCompteur: string;

  @IsEnum(TypeReleve)
  typeReleve: TypeReleve;

  @IsDateString()
  dateFacture: string;

  @IsDateString()
  periodeDebut: string;

  @IsDateString()
  periodeFin: string;

  @IsDateString()
  dateEcheance: string;

  @IsNumber()
  @IsOptional()
  puissanceSouscrite?: number;

  @IsInt()
  @IsOptional()
  nombreMois?: number;

  @IsEnum(TypeEnergie)
  typeEnergie: TypeEnergie;

  @IsInt()
  siteId: number;

  @IsInt()
  fournisseurId: number;

  @IsNumber()
  @IsOptional()
  arrieres?: number;

  @IsNumber()
  @IsOptional()
  paiementsPrecedents?: number;

  @ValidateNested({ each: true })
  @Type(() => LigneConsommationInputDto)
  @ArrayMinSize(1)
  lignesConsommation: LigneConsommationInputDto[];

  @ValidateNested({ each: true })
  @Type(() => TaxeInputDto)
  @IsOptional()
  taxes?: TaxeInputDto[];
}

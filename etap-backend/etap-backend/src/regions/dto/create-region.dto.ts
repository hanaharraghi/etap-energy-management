import { IsString, IsOptional, Length } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  @Length(2, 100)
  nom: string;

  @IsString()
  @Length(2, 10)
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  couleur?: string;
}

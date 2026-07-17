import { IsString, IsInt, IsOptional, Length } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  @Length(2, 150)
  nom: string;

  @IsString()
  @Length(2, 255)
  adresse: string;

  @IsString()
  @Length(2, 50)
  reference: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsInt()
  regionId: number;
}

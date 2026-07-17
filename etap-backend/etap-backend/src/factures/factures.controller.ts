import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FacturesService } from './factures.service';
import { UpdateStatutDto } from './dto/update-statut.dto';
import { CreateFactureDto } from './dto/create-facture.dto';
import { Roles } from '../auth/roles.decorator';
import { LocalUser } from '../auth/local-user.decorator';
import type { Utilisateur } from '@prisma/client';

@Controller('factures')
export class FacturesController {
  constructor(private service: FacturesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFactureDto, @LocalUser() user: Utilisateur) {
    return this.service.create(dto, (user as any).id);
  }

  @Patch(':id/statut')
  @Roles('ADMIN', 'RESPONSABLE_REGIONAL')
  updateStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatutDto,
    @LocalUser() user: Utilisateur,
  ) {
    return this.service.updateStatut(id, dto, (user as any).id);
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(png|jpe?g|tiff?|pdf)$/i;
        if (!allowed.test(file.originalname)) {
          return cb(
            new BadRequestException('Format de fichier non supporté'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async importOcr(
    @UploadedFile() file: Express.Multer.File,
    @Query('siteId', ParseIntPipe) siteId: number,
    @Query('fournisseurId', ParseIntPipe) fournisseurId: number,
    @LocalUser() user: Utilisateur,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    return this.service.importFromOcr(
      file.path,
      siteId,
      fournisseurId,
      (user as any).id,
    );
  }
}

import { Module } from '@nestjs/common';
import { FacturesController } from './factures.controller';
import { FacturesService } from './factures.service';
import { CompteursModule } from '../compteurs/compteurs.module';
import { OcrModule } from '../ocr/ocr.module';
import { AiModule } from '../ai/ai.module';
import { AlertesModule } from '../alertes/alertes.module';

@Module({
  imports: [CompteursModule, OcrModule, AiModule, AlertesModule],
  controllers: [FacturesController],
  providers: [FacturesService],
  exports: [FacturesService],
})
export class FacturesModule {}

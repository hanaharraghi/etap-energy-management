import { Module } from '@nestjs/common';
import { ConsommationsController } from './consommations.controller';
import { ConsommationsService } from './consommations.service';

@Module({
  controllers: [ConsommationsController],
  providers: [ConsommationsService],
})
export class ConsommationsModule {}

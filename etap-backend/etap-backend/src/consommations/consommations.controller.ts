import { Controller, Get } from '@nestjs/common';
import { ConsommationsService } from './consommations.service';

@Controller('consommations')
export class ConsommationsController {
  constructor(private service: ConsommationsService) {}

  @Get('mensuelles')
  mensuelles() {
    return this.service.mensuelles();
  }

  @Get('repartition')
  repartition() {
    return this.service.repartition();
  }
}

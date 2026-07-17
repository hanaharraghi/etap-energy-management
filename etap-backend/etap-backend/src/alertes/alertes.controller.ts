import { Controller, Get, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { AlertesService } from './alertes.service';

@Controller('alertes')
export class AlertesController {
  constructor(private service: AlertesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/lue')
  markLue(@Param('id', ParseIntPipe) id: number) {
    return this.service.markLue(id);
  }

  @Patch(':id/resolve')
  resolve(@Param('id', ParseIntPipe) id: number) {
    return this.service.resolve(id);
  }
}

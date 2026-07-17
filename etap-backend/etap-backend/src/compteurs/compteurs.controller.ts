import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CompteursService } from './compteurs.service';

@Controller('compteurs')
export class CompteursController {
  constructor(private service: CompteursService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}

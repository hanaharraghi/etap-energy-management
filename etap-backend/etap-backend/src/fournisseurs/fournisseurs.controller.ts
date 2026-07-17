import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { FournisseursService } from './fournisseurs.service';

@Controller('fournisseurs')
export class FournisseursController {
  constructor(private service: FournisseursService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}

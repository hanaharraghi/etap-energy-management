import { Controller, Get, Post, Body } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('regions')
export class RegionsController {
  constructor(private service: RegionsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get('repartition')
  repartition() {
    return this.service.repartition();
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateRegionDto) {
    return this.service.create(dto);
  }
}

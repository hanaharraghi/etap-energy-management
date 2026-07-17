import { Controller, Get, Post, Body } from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('sites')
export class SitesController {
  constructor(private service: SitesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Post()
  @Roles('ADMIN', 'RESPONSABLE_REGIONAL')
  create(@Body() dto: CreateSiteDto) {
    return this.service.create(dto);
  }
}

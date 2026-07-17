import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UtilisateursService } from './utilisateurs.service';

@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private service: UtilisateursService) {}

  @Get()
  @Roles('ADMIN', 'RESPONSABLE_REGIONAL')
  findAll() {
    return this.service.findAll();
  }
}

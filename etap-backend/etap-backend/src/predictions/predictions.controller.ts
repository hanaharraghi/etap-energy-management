import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { PredictionsService } from './predictions.service';

@Controller('predictions')
export class PredictionsController {
  constructor(private service: PredictionsService) {}

  @Get()
  findAll(
    @Query('siteId', new ParseIntPipe({ optional: true })) siteId?: number,
  ) {
    return this.service.getPredictions(siteId);
  }
}

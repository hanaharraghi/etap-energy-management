import { Injectable } from '@nestjs/common';
import { AiServiceClient } from '../ai/ai-service.client';

@Injectable()
export class PredictionsService {
  constructor(private ai: AiServiceClient) {}

  /** GET /predictions?siteId=<optional> */
  async getPredictions(siteId?: number) {
    const result = await this.ai.predict({ siteId, horizonMonths: 3 });
    return result;
  }
}

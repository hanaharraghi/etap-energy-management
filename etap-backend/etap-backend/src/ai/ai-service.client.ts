import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface AnomalyDetectionResult {
  anomalie: boolean;
  severite?: 'FAIBLE' | 'MOYENNE' | 'CRITIQUE';
  description?: string;
  score?: number;
}

export interface PredictionResult {
  month: string;
  actual: number | null;
  predicted: number;
  lower: number;
  upper: number;
}

/**
 * Thin HTTP client for the separate FastAPI (Python) AI microservice.
 * This backend never runs ML logic itself — it only calls out to
 * AI_SERVICE_URL and shapes the response for the frontend contract.
 */
@Injectable()
export class AiServiceClient {
  private readonly logger = new Logger(AiServiceClient.name);
  private readonly baseUrl: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('AI_SERVICE_URL') ?? 'http://localhost:8000';
  }

  async detectAnomaly(payload: {
    siteId: number;
    typeEnergie: string;
    quantite: number;
    historique: number[];
  }): Promise<AnomalyDetectionResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<AnomalyDetectionResult>(
          `${this.baseUrl}/detect-anomaly`,
          payload,
          {
            timeout: 5000,
          },
        ),
      );
      return data;
    } catch (err) {
      this.logger.warn(
        `AI service /detect-anomaly unreachable: ${(err as Error).message}`,
      );
      // Fail safe: no anomaly reported rather than blocking facture creation
      // if the AI microservice is temporarily down.
      return { anomalie: false };
    }
  }

  async predict(payload: {
    siteId?: number;
    typeEnergie?: string;
    horizonMonths?: number;
  }): Promise<PredictionResult[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<PredictionResult[]>(`${this.baseUrl}/predict`, payload, {
          timeout: 8000,
        }),
      );
      return data;
    } catch (err) {
      this.logger.warn(
        `AI service /predict unreachable: ${(err as Error).message}`,
      );
      return [];
    }
  }
}

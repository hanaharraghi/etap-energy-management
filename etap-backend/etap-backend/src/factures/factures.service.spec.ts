import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FacturesService } from './factures.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompteursService } from '../compteurs/compteurs.service';
import { OcrService } from '../ocr/ocr.service';
import { AiServiceClient } from '../ai/ai-service.client';
import { AlertesService } from '../alertes/alertes.service';

describe('FacturesService', () => {
  let service: FacturesService;
  let prisma: { facture: { findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      facture: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacturesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CompteursService, useValue: {} },
        { provide: OcrService, useValue: {} },
        { provide: AiServiceClient, useValue: { detectAnomaly: jest.fn() } },
        { provide: AlertesService, useValue: {} },
      ],
    }).compile();

    service = module.get(FacturesService);
  });

  it('refuses to change the status of an already-validated facture', async () => {
    prisma.facture.findUnique.mockResolvedValue({
      id: 1,
      statut: 'VALIDEE',
    });

    await expect(
      service.updateStatut(1, { statut: 'REJETEE' } as any, 42),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.facture.update).not.toHaveBeenCalled();
  });
});

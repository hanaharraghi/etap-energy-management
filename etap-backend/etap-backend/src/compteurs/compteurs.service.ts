import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TypeEnergie } from '@prisma/client';

@Injectable()
export class CompteursService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.compteur.findMany({ include: { site: true } });
  }

  findOne(id: number) {
    return this.prisma.compteur.findUniqueOrThrow({
      where: { id },
      include: { site: true },
    });
  }

  /**
   * Used by the OCR import flow: looks up a Compteur by the physical meter
   * reference extracted from the scanned invoice. If it's genuinely new
   * (never seen before), creates it against the given site — this is what
   * lets us track a meter's index history across multiple invoices.
   */
  async findOrCreate(
    referenceUnique: string,
    type: TypeEnergie,
    siteId: number,
  ) {
    const existing = await this.prisma.compteur.findUnique({
      where: { referenceUnique },
    });
    if (existing) return existing;

    return this.prisma.compteur.create({
      data: { referenceUnique, type, siteId },
    });
  }

  async findByReference(referenceUnique: string) {
    const compteur = await this.prisma.compteur.findUnique({
      where: { referenceUnique },
    });
    if (!compteur) {
      throw new NotFoundException(
        `Aucun compteur avec la référence ${referenceUnique}`,
      );
    }
    return compteur;
  }
}

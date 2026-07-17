import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSiteDto) {
    return this.prisma.site.create({
      data: {
        nom: dto.nom,
        adresse: dto.adresse,
        reference: dto.reference,
        type: dto.type,
        regionId: dto.regionId,
      },
    });
  }

  findAll() {
    return this.prisma.site.findMany({
      include: { region: true, compteurs: true },
    });
  }

  /** GET /sites/summary — matches the frontend SiteSummary[] shape. */
  async summary() {
    const sites = await this.prisma.site.findMany({
      include: {
        region: true,
        compteurs: {
          include: {
            factures: {
              include: { lignesConsommation: true },
              orderBy: { dateFacture: 'desc' },
            },
          },
        },
      },
    });

    return sites.map((site) => {
      const factures = site.compteurs.flatMap((c) => c.factures);
      const totals = { EAU: 0, GAZ: 0, ELECTRICITE: 0 };
      for (const f of factures) {
        const qty = f.lignesConsommation.reduce((s, l) => s + l.quantite, 0);
        totals[f.typeEnergie as keyof typeof totals] += qty;
      }
      const lastInvoice = factures[0]?.dateFacture ?? null;

      return {
        id: site.id,
        name: site.nom,
        region: site.region.nom,
        status: site.statut as 'active' | 'maintenance' | 'inactive',
        type: site.type ?? 'Site',
        electricity: totals.ELECTRICITE,
        water: totals.EAU,
        gas: totals.GAZ,
        cost: factures.reduce((sum, f) => sum + f.montantAPayer, 0),
        lastInvoice: lastInvoice ? lastInvoice.toISOString().slice(0, 10) : '',
        trend: 0, // requires period-over-period comparison — wire up once historical data exists
      };
    });
  }
}

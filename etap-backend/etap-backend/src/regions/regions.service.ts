import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';

const REGION_COLORS = [
  '#005BAC',
  '#00AEEF',
  '#22C55E',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
];

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.region.findMany({ include: { sites: true } });
  }

  create(dto: CreateRegionDto) {
    return this.prisma.region.create({
      data: {
        nom: dto.nom,
        code: dto.code.toUpperCase(),
        description: dto.description,
        couleur:
          dto.couleur ??
          REGION_COLORS[Math.floor(Math.random() * REGION_COLORS.length)],
      },
    });
  }

  /** GET /regions/summary — matches the frontend RegionSummary[] shape. */
  async summary() {
    const regions = await this.prisma.region.findMany({
      include: {
        sites: {
          include: {
            compteurs: {
              include: {
                factures: { include: { lignesConsommation: true } },
              },
            },
          },
        },
      },
    });

    return regions.map((region, i) => {
      const factures = region.sites.flatMap((s) =>
        s.compteurs.flatMap((c) => c.factures),
      );
      const totals = this.sumByEnergy(factures);
      return {
        id: region.id,
        name: region.nom,
        code: region.code,
        sites: region.sites.length,
        invoices: factures.length,
        water: totals.EAU,
        gas: totals.GAZ,
        electricity: totals.ELECTRICITE,
        cost: factures.reduce((sum, f) => sum + f.montantAPayer, 0),
        trend: 0, // requires period-over-period comparison — wire up once historical data exists
        color: region.couleur ?? REGION_COLORS[i % REGION_COLORS.length],
      };
    });
  }

  /** GET /regions/repartition — bar chart data by region code. */
  async repartition() {
    const summaries = await this.summary();
    return summaries.map((r) => ({
      name: r.code,
      elec: r.electricity,
      gas: r.gas,
      water: r.water,
    }));
  }

  private sumByEnergy(
    factures: {
      typeEnergie: string;
      lignesConsommation: { quantite: number }[];
    }[],
  ) {
    const totals = { EAU: 0, GAZ: 0, ELECTRICITE: 0 };
    for (const f of factures) {
      const qty = f.lignesConsommation.reduce((s, l) => s + l.quantite, 0);
      totals[f.typeEnergie as keyof typeof totals] += qty;
    }
    return totals;
  }
}

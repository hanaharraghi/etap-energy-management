import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOIS_FR = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Jun',
  'Jul',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];
const ENERGY_COLORS = {
  ELECTRICITE: '#005BAC',
  GAZ: '#F59E0B',
  EAU: '#00AEEF',
};

@Injectable()
export class ConsommationsService {
  constructor(private prisma: PrismaService) {}

  /** GET /consommations/mensuelles — last 12 months, aggregated across all sites. */
  async mensuelles() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const factures = await this.prisma.facture.findMany({
      where: { dateFacture: { gte: start } },
      include: { lignesConsommation: true },
    });

    const buckets = new Map<
      string,
      { water: number; gas: number; electricity: number; cost: number }
    >();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      buckets.set(`${d.getFullYear()}-${d.getMonth()}`, {
        water: 0,
        gas: 0,
        electricity: 0,
        cost: 0,
      });
    }

    for (const f of factures as any[]) {
      const d = new Date(f.dateFacture);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const qty = f.lignesConsommation.reduce(
        (s: number, l: any) => s + l.quantite,
        0,
      );
      if (f.typeEnergie === 'EAU') bucket.water += qty;
      else if (f.typeEnergie === 'GAZ') bucket.gas += qty;
      else if (f.typeEnergie === 'ELECTRICITE') bucket.electricity += qty;
      bucket.cost += f.montantAPayer;
    }

    return [...buckets.entries()].map(([key, totals]) => {
      const monthIndex = parseInt(key.split('-')[1], 10);
      return { month: MOIS_FR[monthIndex], ...totals };
    });
  }

  /** GET /consommations/repartition — % breakdown by energy type. */
  async repartition() {
    const factures = await this.prisma.facture.findMany({
      include: { lignesConsommation: true },
    });
    const totals = { EAU: 0, GAZ: 0, ELECTRICITE: 0 };
    for (const f of factures as any[]) {
      const qty = f.lignesConsommation.reduce(
        (s: number, l: any) => s + l.quantite,
        0,
      );
      totals[f.typeEnergie as keyof typeof totals] += qty;
    }
    const sum = totals.EAU + totals.GAZ + totals.ELECTRICITE || 1;

    return [
      {
        name: 'Électricité',
        value: Math.round((totals.ELECTRICITE / sum) * 100),
        color: ENERGY_COLORS.ELECTRICITE,
      },
      {
        name: 'Gaz',
        value: Math.round((totals.GAZ / sum) * 100),
        color: ENERGY_COLORS.GAZ,
      },
      {
        name: 'Eau',
        value: Math.round((totals.EAU / sum) * 100),
        color: ENERGY_COLORS.EAU,
      },
    ];
  }
}

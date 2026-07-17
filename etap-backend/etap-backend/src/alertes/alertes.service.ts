import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const alertes = await this.prisma.alerte.findMany({
      include: {
        anomalie: {
          include: {
            facture: { include: { compteur: { include: { site: true } } } },
          },
        },
      },
      orderBy: { dateEnvoi: 'desc' },
    });
    return alertes.map((a) => this.toResponseShape(a));
  }

  async markLue(id: number) {
    const updated = await this.prisma.alerte.update({
      where: { id },
      data: { lue: true },
      include: {
        anomalie: {
          include: {
            facture: { include: { compteur: { include: { site: true } } } },
          },
        },
      },
    });
    return this.toResponseShape(updated);
  }

  /** Marks an alert (and its related anomaly) as resolved. */
  async resolve(id: number) {
    const alerte = await this.prisma.alerte.findUniqueOrThrow({
      where: { id },
    });
    const [updated] = await this.prisma.$transaction([
      this.prisma.alerte.update({
        where: { id },
        data: { statut: 'resolved', lue: true },
        include: {
          anomalie: {
            include: {
              facture: { include: { compteur: { include: { site: true } } } },
            },
          },
        },
      }),
      this.prisma.anomalie.update({
        where: { id: alerte.anomalieId },
        data: { traitee: true },
      }),
    ]);
    return this.toResponseShape(updated);
  }

  /**
   * Creates an alert for every user who should be notified about a new
   * anomaly (the agent who created the invoice + any RESPONSABLE_REGIONAL
   * supervising that site's region). Called after FacturesService detects
   * an anomaly via the AI service.
   */
  async creerPourAnomalie(
    anomalieId: number,
    message: string,
    destinataireIds: number[],
  ) {
    return this.prisma.$transaction(
      destinataireIds.map((destinataireId) =>
        this.prisma.alerte.create({
          data: { anomalieId, message, destinataireId },
        }),
      ),
    );
  }

  private toResponseShape(alerte: any) {
    const facture = alerte.anomalie?.facture;
    return {
      id: alerte.id,
      message: alerte.message,
      title: alerte.titre ?? undefined,
      dateEnvoi: alerte.dateEnvoi,
      lue: alerte.lue,
      anomalieId: alerte.anomalieId,
      destinataireId: alerte.destinataireId,
      factureId: facture?.id,
      time: undefined, // compute relative time client-side from dateEnvoi
      priority: (alerte.priorite as any) ?? undefined,
      site: facture?.compteur?.site?.nom,
      category: alerte.categorie ?? undefined,
      status: alerte.statut ?? 'active',
    };
  }
}

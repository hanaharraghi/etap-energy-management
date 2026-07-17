import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompteursService } from '../compteurs/compteurs.service';
import { OcrService } from '../ocr/ocr.service';
import { AiServiceClient } from '../ai/ai-service.client';
import { AlertesService } from '../alertes/alertes.service';
import { StatutFacture, ModeSaisie, SeveriteAnomalie } from '@prisma/client';
import { UpdateStatutDto } from './dto/update-statut.dto';
import { CreateFactureDto } from './dto/create-facture.dto';

const FACTURE_INCLUDE = {
  compteur: { include: { site: { include: { region: true } } } },
  fournisseur: true,
  lignesConsommation: true,
  taxes: true,
  extractionOCR: true,
} as const;

@Injectable()
export class FacturesService {
  constructor(
    private prisma: PrismaService,
    private compteurs: CompteursService,
    private ocr: OcrService,
    private ai: AiServiceClient,
    private alertes: AlertesService,
  ) {}

  /** POST /factures — manual entry (modeSaisie = MANUEL), as opposed to
   * the OCR import flow. Computes montants from the submitted lines/taxes
   * rather than trusting client-submitted totals. */
  async create(dto: CreateFactureDto, creeParId: number) {
    const compteur = await this.compteurs.findOrCreate(
      dto.referenceCompteur,
      dto.typeEnergie,
      dto.siteId,
    );

    const lignesConsommation = dto.lignesConsommation.map((l) => {
      const quantite = l.nouveauIndex - l.ancienIndex;
      const tauxTVA = l.tauxTVA ?? 19;
      return {
        libelleTranche: l.libelleTranche,
        ancienIndex: l.ancienIndex,
        nouveauIndex: l.nouveauIndex,
        quantite,
        prixUnitaire: l.prixUnitaire,
        montantHT: quantite * l.prixUnitaire,
        tauxTVA,
      };
    });

    const montantHT = lignesConsommation.reduce((s, l) => s + l.montantHT, 0);
    const taxesTotal = (dto.taxes ?? []).reduce((s, t) => s + t.montant, 0);
    const tvaTotal = lignesConsommation.reduce(
      (s, l) => s + (l.montantHT * l.tauxTVA) / 100,
      0,
    );
    const totalTaxes = taxesTotal + tvaTotal;
    const montantTTC = montantHT + totalTaxes;
    const arrieres = dto.arrieres ?? 0;
    const paiementsPrecedents = dto.paiementsPrecedents ?? 0;
    const montantAPayer = montantTTC + arrieres - paiementsPrecedents;

    const facture = await this.prisma.facture.create({
      data: {
        numeroFacture: dto.numeroFacture,
        typeReleve: dto.typeReleve,
        dateFacture: new Date(dto.dateFacture),
        dateEmission: new Date(),
        periodeDebut: new Date(dto.periodeDebut),
        periodeFin: new Date(dto.periodeFin),
        dateEcheance: new Date(dto.dateEcheance),
        puissanceSouscrite: dto.puissanceSouscrite,
        nombreMois: dto.nombreMois ?? 1,
        montantHT,
        totalTaxes,
        montantTTC,
        arrieres,
        paiementsPrecedents,
        montantAPayer,
        typeEnergie: dto.typeEnergie,
        modeSaisie: ModeSaisie.MANUEL,
        statut: StatutFacture.EN_ATTENTE_VALIDATION,
        compteurId: compteur.id,
        fournisseurId: dto.fournisseurId,
        creeParId,
        lignesConsommation: { create: lignesConsommation },
        taxes: { create: dto.taxes ?? [] },
      },
      include: FACTURE_INCLUDE,
    });

    return this.toResponseShape(facture);
  }

  async findAll() {
    const factures = await this.prisma.facture.findMany({
      include: FACTURE_INCLUDE,
      orderBy: { dateFacture: 'desc' },
    });
    return factures.map((f) => this.toResponseShape(f));
  }

  async findOne(id: number) {
    const facture = await this.prisma.facture.findUnique({
      where: { id },
      include: FACTURE_INCLUDE,
    });
    if (!facture) throw new NotFoundException(`Facture ${id} introuvable`);
    return this.toResponseShape(facture);
  }

  /** PATCH /factures/:id/statut — RESPONSABLE_REGIONAL / ADMIN only (enforced at controller level). */
  async updateStatut(id: number, dto: UpdateStatutDto, validateurId: number) {
    const facture = await this.prisma.facture.findUnique({ where: { id } });
    if (!facture) throw new NotFoundException(`Facture ${id} introuvable`);

    if (
      facture.statut === StatutFacture.VALIDEE &&
      dto.statut !== StatutFacture.VALIDEE
    ) {
      throw new BadRequestException(
        'Une facture déjà validée ne peut pas changer de statut.',
      );
    }

    const updated = await this.prisma.facture.update({
      where: { id },
      data: {
        statut: dto.statut,
        motifRejet:
          dto.statut === StatutFacture.REJETEE ? dto.motifRejet : null,
        valideeParId:
          dto.statut === StatutFacture.VALIDEE
            ? validateurId
            : facture.valideeParId,
      },
      include: FACTURE_INCLUDE,
    });

    if (dto.statut === StatutFacture.VALIDEE) {
      await this.runAnomalyDetection(updated.id);
    }

    return this.toResponseShape(updated);
  }

  /**
   * POST /factures/import — runs OCR on the uploaded file, resolves/creates
   * the Compteur by its extracted reference, and persists a new Facture in
   * EN_ATTENTE_VALIDATION with modeSaisie = OCR.
   *
   * NOTE: since OCR can't reliably determine which Region/Site/Fournisseur
   * an invoice belongs to from the scan alone, this expects the caller
   * (frontend) to also supply siteId and fournisseurId — the agent picks
   * these in the UI before/after uploading. Adjust this contract if you'd
   * rather have the frontend prompt for them in a second step.
   */
  async importFromOcr(
    filePath: string,
    siteId: number,
    fournisseurId: number,
    creeParId: number,
  ) {
    const extraction = await this.ocr.extract(filePath);
    const { champs, texteBrut, tauxConfiance } = extraction;

    const fournisseur = await this.prisma.fournisseur.findUniqueOrThrow({
      where: { id: fournisseurId },
    });

    const compteur = champs.referenceCompteur
      ? await this.compteurs.findOrCreate(
          champs.referenceCompteur,
          fournisseur.typeEnergieFournie,
          siteId,
        )
      : await this.compteurs.findOrCreate(
          `AUTO-${Date.now()}`,
          fournisseur.typeEnergieFournie,
          siteId,
        );

    const now = new Date();
    const dateFacture = champs.dateFacture ? new Date(champs.dateFacture) : now;
    const dateEcheance = champs.dateEcheance
      ? new Date(champs.dateEcheance)
      : now;

    const montantHT = champs.montantHT ?? 0;
    const totalTaxes = champs.totalTaxes ?? 0;
    const montantTTC = champs.montantTTC ?? montantHT + totalTaxes;
    const montantAPayer = champs.montantAPayer ?? montantTTC;

    const facture = await this.prisma.facture.create({
      data: {
        numeroFacture: champs.numeroFacture ?? `OCR-${Date.now()}`,
        typeReleve: 'RELEVE',
        dateFacture,
        dateEmission: now,
        periodeDebut: dateFacture,
        periodeFin: dateFacture,
        dateEcheance,
        montantHT,
        totalTaxes,
        montantTTC,
        montantAPayer,
        typeEnergie: fournisseur.typeEnergieFournie,
        modeSaisie: ModeSaisie.OCR,
        statut: StatutFacture.EN_ATTENTE_VALIDATION,
        compteurId: compteur.id,
        fournisseurId,
        creeParId,
        extractionOCR: {
          create: {
            texteBrut,
            donneesExtraites: champs as any,
            tauxConfiance,
          },
        },
        ...(champs.ancienIndex != null && champs.nouveauIndex != null
          ? {
              lignesConsommation: {
                create: [
                  {
                    libelleTranche: 'Consommation',
                    ancienIndex: champs.ancienIndex,
                    nouveauIndex: champs.nouveauIndex,
                    quantite: champs.nouveauIndex - champs.ancienIndex,
                    prixUnitaire: 0,
                    montantHT,
                    tauxTVA: 0,
                  },
                ],
              },
            }
          : {}),
      },
      include: FACTURE_INCLUDE,
    });

    return {
      facture: this.toResponseShape(facture),
      ocrConfidence: tauxConfiance,
    };
  }

  /** Calls the FastAPI anomaly-detection endpoint and persists the result if flagged. */
  private async runAnomalyDetection(factureId: number) {
    const facture = await this.prisma.facture.findUnique({
      where: { id: factureId },
      include: { compteur: true, lignesConsommation: true },
    });
    if (!facture) return;

    const historique = await this.prisma.facture.findMany({
      where: { compteurId: facture.compteurId, id: { not: factureId } },
      include: { lignesConsommation: true },
      orderBy: { dateFacture: 'desc' },
      take: 12,
    });

    const quantite = facture.lignesConsommation.reduce(
      (s, l) => s + l.quantite,
      0,
    );
    const historiqueQuantites = historique.map((f) =>
      f.lignesConsommation.reduce((s, l) => s + l.quantite, 0),
    );

    const result = await this.ai.detectAnomaly({
      siteId: facture.compteur.siteId,
      typeEnergie: facture.typeEnergie,
      quantite,
      historique: historiqueQuantites,
    });

    if (result.anomalie) {
      const anomalie = await this.prisma.anomalie.create({
        data: {
          typeAnomalie: 'CONSOMMATION_ANORMALE',
          description:
            result.description ??
            'Consommation anormale détectée par le modèle IA.',
          severite:
            (result.severite as SeveriteAnomalie) ?? SeveriteAnomalie.MOYENNE,
          factureId,
        },
      });

      // Notify the agent who created the invoice, plus the region's
      // supervising RESPONSABLE_REGIONAL, if one is assigned.
      const site = await this.prisma.site.findUnique({
        where: { id: facture.compteur.siteId },
        include: { region: true },
      });
      const destinataireIds = [
        facture.creeParId,
        site?.region.responsableId,
      ].filter((id): id is number => id != null);
      const uniqueDestinataires = [...new Set(destinataireIds)];

      if (uniqueDestinataires.length > 0) {
        await this.alertes.creerPourAnomalie(
          anomalie.id,
          `Anomalie détectée sur la facture ${facture.numeroFacture} (${site?.nom ?? 'site inconnu'})`,
          uniqueDestinataires,
        );
      }
    }
  }

  /** Shapes a Prisma Facture (with the Compteur relation) into the flat
   * response shape the frontend already expects (siteId, numeroCompteur as
   * a string) — keeps the richer data model internal without breaking the
   * existing frontend contract. */
  private toResponseShape(facture: any) {
    const {
      compteur,
      fournisseur,
      lignesConsommation,
      taxes,
      extractionOCR,
      compteurId,
      ...rest
    } = facture;
    return {
      ...rest,
      siteId: compteur.site.id,
      compteurId,
      numeroCompteur: compteur.referenceUnique,
      siteName: compteur.site.nom,
      regionName: compteur.site.region.nom,
      fournisseurNom: fournisseur.nom,
      ocrConfiance: extractionOCR?.tauxConfiance ?? null,
      lignesConsommation,
      taxes,
    };
  }
}

// Types mirroring prisma/schema.prisma — keep these two files in sync.

export type RoleType = "ADMIN" | "AGENT" | "RESPONSABLE_REGIONAL";
export type TypeEnergie = "EAU" | "GAZ" | "ELECTRICITE";
export type ModeSaisie = "MANUEL" | "OCR";
export type StatutFacture = "BROUILLON" | "EN_ATTENTE_VALIDATION" | "VALIDEE" | "REJETEE";
export type TypeReleve = "RELEVE" | "ESTIMATION";
export type SeveriteAnomalie = "FAIBLE" | "MOYENNE" | "CRITIQUE";

export interface Utilisateur {
  id: number;
  keycloakId: string;
  nom: string;
  prenom: string;
  email: string;
  role: RoleType;
  actif: boolean;
  dateCreation: string;
}

export interface Region {
  id: number;
  nom: string;
  description?: string | null;
  responsableId?: number | null;
}

export interface Site {
  id: number;
  nom: string;
  adresse: string;
  reference: string;
  regionId: number;
}

export interface Fournisseur {
  id: number;
  nom: string;
  codeFournisseur: string;
  typeEnergieFournie: TypeEnergie;
  telephone?: string | null;
  adresse?: string | null;
}

export interface LigneConsommation {
  id: number;
  libelleTranche: string;
  ancienIndex: number;
  nouveauIndex: number;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  tauxTVA: number;
}

export interface Taxe {
  id: number;
  libelle: string;
  base?: number | null;
  tauxOuPU?: number | null;
  montant: number;
}

export interface ExtractionOCR {
  id: number;
  texteBrut?: string | null;
  donneesExtraites?: Record<string, unknown> | null;
  tauxConfiance: number;
  dateExtraction: string;
}

export interface Facture {
  id: number;
  numeroFacture: string;
  numeroCompteur: string;
  typeReleve: TypeReleve;
  dateFacture: string;
  dateEmission: string;
  periodeDebut: string;
  periodeFin: string;
  dateEcheance: string;
  puissanceSouscrite?: number | null;
  nombreMois: number;
  montantHT: number;
  totalTaxes: number;
  montantTTC: number;
  arrieres: number;
  paiementsPrecedents: number;
  montantAPayer: number;
  typeEnergie: TypeEnergie;
  modeSaisie: ModeSaisie;
  statut: StatutFacture;
  motifRejet?: string | null;
  fichierScanUrl?: string | null;
  siteId: number;
  fournisseurId: number;
  creeParId: number;
  valideeParId?: number | null;

  // convenience fields, populated by the API for list/detail views
  siteName?: string;
  regionName?: string;
  fournisseurNom?: string;
  ocrConfiance?: number | null;
  lignesConsommation?: LigneConsommation[];
  taxes?: Taxe[];
}

export interface Anomalie {
  id: number;
  typeAnomalie: string;
  description: string;
  severite: SeveriteAnomalie;
  dateDetection: string;
  traitee: boolean;
  factureId: number;
}

export interface Alerte {
  id: number;
  message: string;
  dateEnvoi: string;
  lue: boolean;
  anomalieId: number;
  destinataireId: number;

  // convenience fields for display
  title?: string;
  time?: string;
  factureId?: number;
  priority?: "critical" | "warning" | "info";
  site?: string;
  category?: string;
  status?: "active" | "resolved";
}

export interface Prediction {
  id: number;
  periodeCible: string;
  valeurPredite: number;
  modeleUtilise: string;
  dateGeneration: string;
  intervalleConfiance?: number | null;
  typeEnergie: TypeEnergie;
  siteId: number;
}

// ── Aggregate / dashboard shapes returned by convenience endpoints ─────────

export interface MonthlyConsumption {
  month: string;
  water: number;
  gas: number;
  electricity: number;
  cost: number;
}

export interface RegionSummary {
  id: number;
  name: string;
  code: string;
  sites: number;
  invoices: number;
  water: number;
  gas: number;
  electricity: number;
  cost: number;
  trend: number;
  color: string;
}

export interface SiteSummary {
  id: number;
  name: string;
  region: string;
  status: "active" | "maintenance" | "inactive";
  type: string;
  electricity: number;
  water: number;
  gas: number;
  cost: number;
  lastInvoice: string;
  trend: number;
}

export interface PredictionPoint {
  month: string;
  actual: number | null;
  predicted: number;
  lower: number;
  upper: number;
}

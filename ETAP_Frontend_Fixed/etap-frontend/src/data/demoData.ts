// Demo dataset used as a fallback when the backend API is unreachable
// (see src/lib/api/client.ts). Reflects the real Tunisian context: STEG for
// electricity/gas, SONEDE for water — replace with live data once the
// NestJS backend + Prisma database are running.

import type {
  Facture, RegionSummary, SiteSummary, Alerte, Utilisateur,
  MonthlyConsumption, PredictionPoint, Fournisseur,
} from "../types/models";

export const isDemoMode = () => {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  return !apiUrl || import.meta.env.VITE_USE_MOCK === "true";
};

export const demoFournisseurs: Fournisseur[] = [
  { id: 1, nom: "STEG", codeFournisseur: "STEG", typeEnergieFournie: "ELECTRICITE" },
  { id: 2, nom: "STEG", codeFournisseur: "STEG-GAZ", typeEnergieFournie: "GAZ" },
  { id: 3, nom: "SONEDE", codeFournisseur: "SONEDE", typeEnergieFournie: "EAU" },
];

export const demoMonthlyConsumption: MonthlyConsumption[] = [
  { month: "Jan", water: 950, gas: 680, electricity: 2100, cost: 95000 },
  { month: "Fév", water: 880, gas: 720, electricity: 1950, cost: 91000 },
  { month: "Mar", water: 1020, gas: 590, electricity: 2250, cost: 105000 },
  { month: "Avr", water: 940, gas: 510, electricity: 2100, cost: 98000 },
  { month: "Mai", water: 1100, gas: 450, electricity: 2400, cost: 112000 },
  { month: "Jun", water: 1250, gas: 380, electricity: 2800, cost: 128000 },
  { month: "Jul", water: 1400, gas: 320, electricity: 3100, cost: 145000 },
  { month: "Aoû", water: 1350, gas: 340, electricity: 3050, cost: 142000 },
  { month: "Sep", water: 1150, gas: 420, electricity: 2600, cost: 120000 },
  { month: "Oct", water: 980, gas: 560, electricity: 2200, cost: 102000 },
  { month: "Nov", water: 900, gas: 650, electricity: 2050, cost: 96000 },
  { month: "Déc", water: 920, gas: 700, electricity: 2080, cost: 98000 },
];

export const demoFactures: Facture[] = [
  { id: 1, numeroFacture: "FAC-2025-0847", numeroCompteur: "02178702447600", typeReleve: "RELEVE", dateFacture: "2025-06-12", dateEmission: "2025-06-12", periodeDebut: "2025-02-13", periodeFin: "2025-06-12", dateEcheance: "2025-07-10", puissanceSouscrite: 13, nombreMois: 4, montantHT: 873.328, totalTaxes: 103.805, montantTTC: 977.133, arrieres: 0, paiementsPrecedents: 427.085, montantAPayer: 550.0, typeEnergie: "ELECTRICITE", modeSaisie: "OCR", statut: "VALIDEE", siteId: 1, fournisseurId: 1, creeParId: 2, siteName: "Siège Tunis", regionName: "Tunis", fournisseurNom: "STEG", ocrConfiance: 96 },
  { id: 2, numeroFacture: "FAC-2025-0846", numeroCompteur: "71510100", typeReleve: "RELEVE", dateFacture: "2025-10-08", dateEmission: "2025-10-08", periodeDebut: "2025-09-08", periodeFin: "2025-10-08", dateEcheance: "2025-11-01", nombreMois: 1, montantHT: 33640, totalTaxes: 23527, montantTTC: 57100, arrieres: 0, paiementsPrecedents: 0, montantAPayer: 57100, typeEnergie: "EAU", modeSaisie: "OCR", statut: "EN_ATTENTE_VALIDATION", siteId: 3, fournisseurId: 3, creeParId: 2, siteName: "Usine Métlaoui", regionName: "Gafsa", fournisseurNom: "SONEDE", ocrConfiance: 88 },
  { id: 3, numeroFacture: "FAC-2025-0845", numeroCompteur: "44821190", typeReleve: "ESTIMATION", dateFacture: "2025-06-05", dateEmission: "2025-06-05", periodeDebut: "2025-05-05", periodeFin: "2025-06-05", dateEcheance: "2025-06-25", nombreMois: 1, montantHT: 28900, totalTaxes: 4300, montantTTC: 33200, arrieres: 0, paiementsPrecedents: 0, montantAPayer: 33200, typeEnergie: "GAZ", modeSaisie: "MANUEL", statut: "VALIDEE", siteId: 2, fournisseurId: 2, creeParId: 3, siteName: "Usine Sfax", regionName: "Sfax", fournisseurNom: "STEG", ocrConfiance: null },
  { id: 4, numeroFacture: "FAC-2025-0844", numeroCompteur: "02178702447601", typeReleve: "RELEVE", dateFacture: "2025-06-11", dateEmission: "2025-06-11", periodeDebut: "2025-02-11", periodeFin: "2025-06-11", dateEcheance: "2025-07-05", nombreMois: 4, montantHT: 8100, totalTaxes: 650, montantTTC: 8750, arrieres: 0, paiementsPrecedents: 0, montantAPayer: 8750, typeEnergie: "ELECTRICITE", modeSaisie: "OCR", statut: "REJETEE", motifRejet: "Confiance OCR insuffisante — index illisible", siteId: 4, fournisseurId: 1, creeParId: 2, siteName: "Bureau Sousse", regionName: "Sousse", fournisseurNom: "STEG", ocrConfiance: 62 },
  { id: 5, numeroFacture: "FAC-2025-0843", numeroCompteur: "88213765", typeReleve: "RELEVE", dateFacture: "2025-06-10", dateEmission: "2025-06-10", periodeDebut: "2025-05-10", periodeFin: "2025-06-10", dateEcheance: "2025-06-30", nombreMois: 1, montantHT: 5100, totalTaxes: 500, montantTTC: 5600, arrieres: 0, paiementsPrecedents: 0, montantAPayer: 5600, typeEnergie: "EAU", modeSaisie: "OCR", statut: "VALIDEE", siteId: 1, fournisseurId: 3, creeParId: 3, siteName: "Siège Tunis", regionName: "Tunis", fournisseurNom: "SONEDE", ocrConfiance: 97 },
  { id: 6, numeroFacture: "FAC-2025-0842", numeroCompteur: "44821191", typeReleve: "RELEVE", dateFacture: "2025-06-09", dateEmission: "2025-06-09", periodeDebut: "2025-05-09", periodeFin: "2025-06-09", dateEcheance: "2025-06-29", nombreMois: 1, montantHT: 60200, totalTaxes: 7600, montantTTC: 67800, arrieres: 0, paiementsPrecedents: 0, montantAPayer: 67800, typeEnergie: "GAZ", modeSaisie: "OCR", statut: "EN_ATTENTE_VALIDATION", siteId: 2, fournisseurId: 2, creeParId: 2, siteName: "Usine Sfax", regionName: "Sfax", fournisseurNom: "STEG", ocrConfiance: 81 },
  { id: 7, numeroFacture: "FAC-2025-0841", numeroCompteur: "02178702447602", typeReleve: "RELEVE", dateFacture: "2025-06-08", dateEmission: "2025-06-08", periodeDebut: "2025-02-08", periodeFin: "2025-06-08", dateEcheance: "2025-07-01", nombreMois: 4, montantHT: 28900, totalTaxes: 3200, montantTTC: 32100, arrieres: 0, paiementsPrecedents: 0, montantAPayer: 32100, typeEnergie: "ELECTRICITE", modeSaisie: "MANUEL", statut: "VALIDEE", siteId: 5, fournisseurId: 1, creeParId: 3, siteName: "Usine Gabès", regionName: "Gabès", fournisseurNom: "STEG", ocrConfiance: null },
  { id: 8, numeroFacture: "FAC-2025-0840", numeroCompteur: "71510101", typeReleve: "RELEVE", dateFacture: "2025-06-07", dateEmission: "2025-06-07", periodeDebut: "2025-05-07", periodeFin: "2025-06-07", dateEcheance: "2025-06-27", nombreMois: 1, montantHT: 8900, totalTaxes: 900, montantTTC: 9800, arrieres: 0, paiementsPrecedents: 0, montantAPayer: 9800, typeEnergie: "EAU", modeSaisie: "OCR", statut: "VALIDEE", siteId: 3, fournisseurId: 3, creeParId: 2, siteName: "Usine Métlaoui", regionName: "Gafsa", fournisseurNom: "SONEDE", ocrConfiance: 93 },
];

export const demoAlertes: Alerte[] = [
  { id: 1, title: "Pic de consommation électrique", message: "Consommation électrique au Siège Tunis 45% au-dessus de la moyenne mensuelle — vérification immédiate requise", dateEnvoi: "2025-07-04T10:48:00Z", time: "il y a 12 min", lue: false, anomalieId: 1, destinataireId: 1, priority: "critical", site: "Siège Tunis", category: "consommation", status: "active" },
  { id: 2, title: "Échec de validation OCR", message: "Échec de validation de facture — confiance OCR sous le seuil de 70% pour FAC-2025-0844", dateEnvoi: "2025-07-04T09:50:00Z", time: "il y a 1h", lue: false, anomalieId: 2, destinataireId: 1, priority: "critical", site: "Bureau Sousse", category: "ocr", status: "active" },
  { id: 3, title: "Tendance de consommation de gaz", message: "Hausse de 18% par rapport au mois dernier à l'usine de Sfax — à surveiller", dateEnvoi: "2025-07-04T07:50:00Z", time: "il y a 3h", lue: true, anomalieId: 3, destinataireId: 2, priority: "warning", site: "Usine Sfax", category: "consommation", status: "active" },
  { id: 4, title: "Anomalie sur compteur d'eau", message: "Anomalie sur le compteur d'eau — fuite possible ou erreur de relevé à l'usine de Métlaoui", dateEnvoi: "2025-07-04T05:50:00Z", time: "il y a 5h", lue: true, anomalieId: 4, destinataireId: 2, priority: "warning", site: "Usine Métlaoui", category: "anomalie", status: "active" },
  { id: 5, title: "Seuil budgétaire mensuel", message: "85% du budget électricité mensuel consommé — 15 jours restants dans le cycle", dateEnvoi: "2025-07-03T10:50:00Z", time: "il y a 1j", lue: true, anomalieId: 5, destinataireId: 2, priority: "info", site: "Usine Gabès", category: "budget", status: "active" },
  { id: 6, title: "Écart de prédiction IA", message: "Consommation réelle en écart de 22% par rapport à la prédiction IA — réentraînement du modèle lancé", dateEnvoi: "2025-07-02T10:50:00Z", time: "il y a 2j", lue: true, anomalieId: 6, destinataireId: 1, priority: "critical", site: "Usine Métlaoui", category: "ia", status: "resolved" },
  { id: 7, title: "Retard de facture fournisseur", message: "Facture STEG de juin toujours en attente — relance à effectuer auprès du fournisseur", dateEnvoi: "2025-07-01T10:50:00Z", time: "il y a 3j", lue: true, anomalieId: 7, destinataireId: 2, priority: "warning", site: "Tous les sites", category: "facturation", status: "resolved" },
  { id: 8, title: "Nouveau site en cours d'intégration", message: "Site de Nabeul ajouté au suivi — configuration en attente de validation", dateEnvoi: "2025-06-30T10:50:00Z", time: "il y a 4j", lue: true, anomalieId: 8, destinataireId: 1, priority: "info", site: "Site Nabeul", category: "systeme", status: "resolved" },
];

export const demoRegions: RegionSummary[] = [
  { id: 1, name: "Tunis", code: "TUN", sites: 8, invoices: 142, water: 2450, gas: 1680, electricity: 5230, cost: 285000, trend: 5.2, color: "#005BAC" },
  { id: 2, name: "Sfax", code: "SFX", sites: 5, invoices: 98, water: 1820, gas: 1240, electricity: 3980, cost: 198000, trend: -2.1, color: "#00AEEF" },
  { id: 3, name: "Gafsa", code: "GAF", sites: 4, invoices: 87, water: 3200, gas: 2800, electricity: 6100, cost: 412000, trend: 8.3, color: "#22C55E" },
  { id: 4, name: "Sousse", code: "SOU", sites: 3, invoices: 65, water: 980, gas: 720, electricity: 2100, cost: 124000, trend: 1.7, color: "#F59E0B" },
  { id: 5, name: "Gabès", code: "GAB", sites: 3, invoices: 71, water: 1100, gas: 890, electricity: 2450, cost: 148000, trend: -4.3, color: "#8B5CF6" },
  { id: 6, name: "Nabeul", code: "NAB", sites: 2, invoices: 48, water: 650, gas: 480, electricity: 1280, cost: 78000, trend: 0.9, color: "#EC4899" },
];

export const demoSites: SiteSummary[] = [
  { id: 1, name: "Siège Tunis", region: "Tunis", status: "active", type: "Bureau", electricity: 5230, water: 1250, gas: 380, cost: 85000, lastInvoice: "2025-06-12", trend: 5.2 },
  { id: 2, name: "Usine Sfax", region: "Sfax", status: "active", type: "Industriel", electricity: 18500, water: 8200, gas: 12400, cost: 285000, lastInvoice: "2025-06-09", trend: 8.3 },
  { id: 3, name: "Usine Métlaoui", region: "Gafsa", status: "active", type: "Industriel", electricity: 9800, water: 3400, gas: 5600, cost: 142000, lastInvoice: "2025-10-08", trend: -2.1 },
  { id: 4, name: "Bureau Sousse", region: "Sousse", status: "maintenance", type: "Bureau", electricity: 1850, water: 420, gas: 280, cost: 28500, lastInvoice: "2025-06-11", trend: -4.3 },
  { id: 5, name: "Usine Gabès", region: "Gabès", status: "active", type: "Industriel", electricity: 7200, gas: 3800, water: 1560, cost: 98000, lastInvoice: "2025-06-08", trend: 1.7 },
  { id: 6, name: "Laboratoire Tunis", region: "Tunis", status: "active", type: "Laboratoire", electricity: 2100, water: 580, gas: 220, cost: 35000, lastInvoice: "2025-06-07", trend: 3.4 },
];

export const demoUtilisateurs: (Utilisateur & { avatar: string; dept: string; lastLogin: string })[] = [
  { id: 1, keycloakId: "kc-1", nom: "Trabelsi", prenom: "Ahmed", email: "ahmed.trabelsi@etap.tn", role: "ADMIN", actif: true, dateCreation: "2024-01-10", avatar: "AT", dept: "IT", lastLogin: "il y a 2h" },
  { id: 2, keycloakId: "kc-2", nom: "Zouari", prenom: "Fatma", email: "fatma.zouari@etap.tn", role: "RESPONSABLE_REGIONAL", actif: true, dateCreation: "2024-02-14", avatar: "FZ", dept: "Opérations", lastLogin: "il y a 1j" },
  { id: 3, keycloakId: "kc-3", nom: "Mahmoudi", prenom: "Karim", email: "karim.mahmoudi@etap.tn", role: "AGENT", actif: true, dateCreation: "2024-03-02", avatar: "KM", dept: "Finance", lastLogin: "il y a 3h" },
  { id: 4, keycloakId: "kc-4", nom: "Belhadj", prenom: "Nadia", email: "nadia.belhadj@etap.tn", role: "AGENT", actif: false, dateCreation: "2024-04-18", avatar: "NB", dept: "Opérations", lastLogin: "il y a 15j" },
  { id: 5, keycloakId: "kc-5", nom: "Hamdi", prenom: "Omar", email: "omar.hamdi@etap.tn", role: "RESPONSABLE_REGIONAL", actif: true, dateCreation: "2024-05-20", avatar: "OH", dept: "Audit", lastLogin: "il y a 1h" },
];

export const demoPredictionData: PredictionPoint[] = [
  { month: "Sep", actual: 2600, predicted: 2550, lower: 2400, upper: 2700 },
  { month: "Oct", actual: 2200, predicted: 2280, lower: 2100, upper: 2450 },
  { month: "Nov", actual: 2050, predicted: 2100, lower: 1950, upper: 2250 },
  { month: "Déc", actual: 2080, predicted: 2000, lower: 1880, upper: 2120 },
  { month: "Jan", actual: null, predicted: 2150, lower: 1980, upper: 2320 },
  { month: "Fév", actual: null, predicted: 2050, lower: 1880, upper: 2220 },
  { month: "Mar", actual: null, predicted: 2300, lower: 2100, upper: 2500 },
];

export const demoEnergyMix = [
  { name: "Électricité", value: 58, color: "#005BAC" },
  { name: "Gaz", value: 28, color: "#F59E0B" },
  { name: "Eau", value: 14, color: "#00AEEF" },
];

export const demoRegionBarData = demoRegions.map((r) => ({ name: r.code, elec: r.electricity, gas: r.gas, water: r.water }));

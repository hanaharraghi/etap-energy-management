import { apiFetch, withFallback } from "./client";
import { demoFactures } from "../../data/demoData";
import type { Facture, StatutFacture } from "../../types/models";
import keycloak from "../keycloak";

export function listFactures() {
  return withFallback(() => apiFetch<Facture[]>("/factures"), demoFactures);
}

export function getFacture(id: number) {
  return withFallback(
    () => apiFetch<Facture>(`/factures/${id}`),
    demoFactures.find((f) => f.id === id) ?? demoFactures[0]
  );
}

export function updateFactureStatut(id: number, statut: StatutFacture, motifRejet?: string) {
  return apiFetch<Facture>(`/factures/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut, motifRejet }),
  });
}

export interface CreateFactureInput {
  numeroFacture: string;
  referenceCompteur: string;
  typeReleve: "RELEVE" | "ESTIMATION";
  dateFacture: string;
  periodeDebut: string;
  periodeFin: string;
  dateEcheance: string;
  puissanceSouscrite?: number;
  nombreMois?: number;
  typeEnergie: "EAU" | "GAZ" | "ELECTRICITE";
  siteId: number;
  fournisseurId: number;
  arrieres?: number;
  paiementsPrecedents?: number;
  lignesConsommation: {
    libelleTranche: string;
    ancienIndex: number;
    nouveauIndex: number;
    prixUnitaire: number;
    tauxTVA?: number;
  }[];
  taxes?: { libelle: string; montant: number }[];
}

export function createFacture(data: CreateFactureInput) {
  return apiFetch<Facture>("/factures", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function importFactureOCR(file: File, siteId: number, fournisseurId: number) {
  const formData = new FormData();
  formData.append("file", file);
  // Note: apiFetch sets Content-Type: application/json by default, which is
  // wrong for multipart uploads — this call intentionally bypasses it.
  // siteId/fournisseurId are required query params: OCR can read a meter
  // reference off the scan, but can't infer which site/supplier an invoice
  // belongs to — the backend expects the uploader to supply both.
  const API_URL = import.meta.env.VITE_API_URL as string | undefined;
  if (!API_URL) {
    return Promise.reject(new Error("VITE_API_URL is not configured — OCR import requires the real backend"));
  }
  const qs = new URLSearchParams({ siteId: String(siteId), fournisseurId: String(fournisseurId) });
  const headers: HeadersInit = {};
  if (keycloak.token) headers["Authorization"] = `Bearer ${keycloak.token}`;
  return fetch(`${API_URL}/factures/import?${qs}`, { method: "POST", body: formData, headers }).then((r) => {
    if (!r.ok) throw new Error(`OCR import failed (${r.status})`);
    return r.json();
  });
}

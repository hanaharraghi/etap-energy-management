import { apiFetch, withFallback } from "./client";
import {
  demoRegions, demoSites, demoAlertes, demoUtilisateurs,
  demoMonthlyConsumption, demoPredictionData, demoEnergyMix, demoRegionBarData,
} from "../../data/demoData";
import type {
  RegionSummary, SiteSummary, Alerte, Utilisateur,
  MonthlyConsumption, PredictionPoint,
} from "../../types/models";

export function listRegions() {
  return withFallback(() => apiFetch<RegionSummary[]>("/regions/summary"), demoRegions);
}

export function createRegion(data: { nom: string; code: string; description?: string; couleur?: string }) {
  return apiFetch<{ id: number; nom: string; code: string }>("/regions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listSites() {
  return withFallback(() => apiFetch<SiteSummary[]>("/sites/summary"), demoSites);
}

export function createSite(data: { nom: string; adresse: string; reference: string; type?: string; regionId: number }) {
  return apiFetch<{ id: number; nom: string }>("/sites", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listAlertes() {
  return withFallback(() => apiFetch<Alerte[]>("/alertes"), demoAlertes);
}

export function markAlerteLue(id: number) {
  return apiFetch<Alerte>(`/alertes/${id}/lue`, { method: "PATCH" });
}

export function resolveAlerte(id: number) {
  return apiFetch<Alerte>(`/alertes/${id}/resolve`, { method: "PATCH" });
}

export function listUtilisateurs() {
  return withFallback(
    () => apiFetch<typeof demoUtilisateurs>("/utilisateurs"),
    demoUtilisateurs
  );
}

export function getMonthlyConsumption() {
  return withFallback(
    () => apiFetch<MonthlyConsumption[]>("/consommations/mensuelles"),
    demoMonthlyConsumption
  );
}

export function getPredictions(siteId?: number) {
  const qs = siteId ? `?siteId=${siteId}` : "";
  return withFallback(
    () => apiFetch<PredictionPoint[]>(`/predictions${qs}`),
    demoPredictionData
  );
}

export function getEnergyMix() {
  return withFallback(() => apiFetch<typeof demoEnergyMix>("/consommations/repartition"), demoEnergyMix);
}

export function getRegionBarData() {
  return withFallback(() => apiFetch<typeof demoRegionBarData>("/regions/repartition"), demoRegionBarData);
}

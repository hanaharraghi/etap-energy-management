import { apiFetch, withFallback } from "./client";
import { demoFournisseurs } from "../../data/demoData";
import type { Fournisseur } from "../../types/models";

export function listFournisseurs() {
  return withFallback(() => apiFetch<Fournisseur[]>("/fournisseurs"), demoFournisseurs);
}

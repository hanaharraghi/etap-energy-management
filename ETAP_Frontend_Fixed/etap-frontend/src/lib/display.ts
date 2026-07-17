import type { StatutFacture, TypeEnergie } from "../types/models";

/** Formats an ISO date string as a short French relative time (e.g. "il y a
 * 2h"). Falls back gracefully for invalid/missing dates. Used instead of a
 * server-computed field since "last seen" style values shouldn't be trusted
 * as static data — they're always relative to *now*. */
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ < 30) return `il y a ${diffJ}j`;
  return date.toLocaleDateString("fr-TN");
}

/** Maps the Prisma StatutFacture enum to the StatusBadge component's keys. */
export function statutToBadgeKey(statut: StatutFacture): string {
  switch (statut) {
    case "VALIDEE":
      return "validated";
    case "EN_ATTENTE_VALIDATION":
      return "pending";
    case "REJETEE":
      return "error";
    case "BROUILLON":
    default:
      return "default";
  }
}

/** Maps the Prisma TypeEnergie enum to the EnergyIcon component's keys. */
export function energieToIconKey(type: TypeEnergie): "electricity" | "water" | "gas" {
  switch (type) {
    case "ELECTRICITE":
      return "electricity";
    case "EAU":
      return "water";
    case "GAZ":
      return "gas";
  }
}

export const formatTND = (amount: number) =>
  `${amount.toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;

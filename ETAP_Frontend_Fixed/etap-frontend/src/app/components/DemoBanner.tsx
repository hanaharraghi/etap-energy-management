import { Info } from "lucide-react";

export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
      <Info size={14} className="shrink-0" />
      <span>
        Données de démonstration — configurez <code className="font-mono">VITE_API_URL</code> pour afficher les données réelles du backend.
      </span>
    </div>
  );
}

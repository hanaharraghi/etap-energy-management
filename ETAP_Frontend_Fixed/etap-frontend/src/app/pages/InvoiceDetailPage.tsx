import { useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, Download, Check, X } from "lucide-react";
import { cn, Card, Button, SectionHeader, StatusBadge, EnergyIcon } from "../components/shared";
import { DemoBanner } from "../components/DemoBanner";
import { NavigateFn } from "../routes";
import { useApiData } from "../../hooks/useApiData";
import { getFacture, updateFactureStatut } from "../../lib/api/factures";
import { demoFactures } from "../../data/demoData";
import { energieToIconKey, statutToBadgeKey, formatTND } from "../../lib/display";
import { getCurrentUser } from "../../lib/keycloak";

function InvoiceDetailPage({ onNavigate }: { onNavigate: NavigateFn }) {
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id")) || demoFactures[0].id;
  const { data: inv, isDemo, refetch } = useApiData(() => getFacture(id), demoFactures.find(f => f.id === id) ?? demoFactures[0]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const user = getCurrentUser();
  const canValidate = user?.roles.some(r => r === "ADMIN" || r === "RESPONSABLE_REGIONAL") ?? false;
  const canAct = canValidate && !isDemo && inv.statut === "EN_ATTENTE_VALIDATION";

  const handleValidate = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await updateFactureStatut(inv.id, "VALIDEE");
      refetch();
    } catch (err: any) {
      setActionError(err.message || "Échec de la validation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const motif = window.prompt("Motif du rejet :");
    if (!motif) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateFactureStatut(inv.id, "REJETEE", motif);
      refetch();
    } catch (err: any) {
      setActionError(err.message || "Échec du rejet");
    } finally {
      setActionLoading(false);
    }
  };

  const overallConfidence = inv.ocrConfiance ?? 100;

  const fields = [
    { label: "Numéro de facture", value: inv.numeroFacture, confidence: 99 },
    { label: "Fournisseur", value: inv.fournisseurNom ?? "—", confidence: 97 },
    { label: "Numéro de compteur", value: inv.numeroCompteur, confidence: 94 },
    { label: "Période", value: `${inv.periodeDebut} → ${inv.periodeFin}`, confidence: 96 },
    { label: "Type de relevé", value: inv.typeReleve === "RELEVE" ? "Relevé réel" : "Estimation", confidence: 92 },
    { label: "Montant HT", value: formatTND(inv.montantHT), confidence: 96 },
    { label: "Total des taxes", value: formatTND(inv.totalTaxes), confidence: 93 },
    { label: "Montant TTC", value: formatTND(inv.montantTTC), confidence: 96 },
    { label: "Arriérés", value: formatTND(inv.arrieres), confidence: 90 },
    { label: "Paiements précédents", value: formatTND(inv.paiementsPrecedents), confidence: 90 },
    { label: "Montant à payer", value: formatTND(inv.montantAPayer), confidence: 97 },
    { label: "Date d'échéance", value: inv.dateEcheance, confidence: 91 },
    ...(inv.statut === "REJETEE" && inv.motifRejet
      ? [{ label: "Motif du rejet", value: inv.motifRejet, confidence: 100 }]
      : []),
  ];

  return (
    <div className="space-y-5">
      <DemoBanner show={isDemo} />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} onClick={() => onNavigate("invoices")} className="print:hidden">Back</Button>
        <div className="flex items-center gap-3">
          <EnergyIcon type={energieToIconKey(inv.typeEnergie)} />
          <div>
            <h2 className="text-base font-semibold text-foreground">{inv.numeroFacture}</h2>
            <p className="text-xs text-muted-foreground">{inv.fournisseurNom} · {inv.siteName}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 print:hidden">
          <StatusBadge status={statutToBadgeKey(inv.statut)} />
          <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={() => window.print()}>Export PDF</Button>
          {canAct && (
            <>
              <Button variant="outline" size="sm" icon={<X size={13} />} onClick={handleReject} disabled={actionLoading}>
                Rejeter
              </Button>
              <Button variant="primary" size="sm" icon={<Check size={13} />} onClick={handleValidate} disabled={actionLoading}>
                {actionLoading ? "..." : "Valider"}
              </Button>
            </>
          )}
        </div>
        {actionError && (
          <p className="text-xs text-red-600 w-full mt-1">{actionError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* OCR Fields */}
        <Card className="xl:col-span-2 p-5">
          <SectionHeader title="OCR Extracted Fields" subtitle="Automatically extracted and validated" />
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.label} className="bg-muted/50 border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                    f.confidence >= 95 ? "bg-green-100 text-green-700" :
                      f.confidence >= 85 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                    {f.confidence}%
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Invoice Summary</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "Date de facture", value: inv.dateFacture },
                { label: "Site", value: inv.siteName ?? "—" },
                { label: "Région", value: inv.regionName ?? "—" },
                { label: "Type d'énergie", value: inv.typeEnergie },
                { label: "Montant à payer", value: formatTND(inv.montantAPayer) },
                { label: "Score OCR", value: inv.ocrConfiance != null ? `${inv.ocrConfiance}%` : "Saisie manuelle" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Overall Confidence</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#005BAC" strokeWidth="3"
                    strokeDasharray={`${overallConfidence} 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{overallConfidence}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-green-600 font-medium mt-2">
              {overallConfidence >= 90 ? "Confiance élevée" : overallConfidence >= 75 ? "Confiance moyenne" : "Vérification recommandée"}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}


export { InvoiceDetailPage };

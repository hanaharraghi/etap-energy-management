import { useState } from "react";
import { motion } from "motion/react";
import { Search, Download, Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, Card, Button, Input, StatusBadge, EnergyIcon, Modal, FormField } from "../components/shared";
import { DemoBanner } from "../components/DemoBanner";
import { Page } from "../routes";
import { useApiData } from "../../hooks/useApiData";
import { listFactures, createFacture } from "../../lib/api/factures";
import { listSites, listRegions } from "../../lib/api";
import { listFournisseurs } from "../../lib/api/fournisseurs";
import { demoFactures, demoSites, demoFournisseurs } from "../../data/demoData";
import { energieToIconKey, statutToBadgeKey, formatTND } from "../../lib/display";

function exportInvoicesCSV(invoices: typeof demoFactures) {
  const headers = ["Numéro", "Fournisseur", "Site", "Type", "Date", "Montant à payer (TND)", "Statut"];
  const rows = invoices.map(inv => [
    inv.numeroFacture, inv.fournisseurNom ?? "", inv.siteName ?? "", inv.typeEnergie,
    inv.dateFacture, inv.montantAPayer.toFixed(3), inv.statut,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const emptyManualForm = {
  numeroFacture: "", referenceCompteur: "", typeReleve: "RELEVE" as "RELEVE" | "ESTIMATION",
  typeEnergie: "ELECTRICITE" as "EAU" | "GAZ" | "ELECTRICITE",
  siteId: "" as number | "", fournisseurId: "" as number | "",
  dateFacture: "", periodeDebut: "", periodeFin: "", dateEcheance: "",
  ancienIndex: "", nouveauIndex: "", prixUnitaire: "",
};

function InvoicesPage({ onNavigate }: { onNavigate: (p: Page, params?: Record<string, string>) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const { data: invoices, isDemo, refetch } = useApiData(listFactures, demoFactures);
  const { data: sites } = useApiData(listSites, demoSites);
  const { data: fournisseurs } = useApiData(listFournisseurs, demoFournisseurs);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyManualForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCreate = async () => {
    const required = [form.numeroFacture, form.referenceCompteur, form.dateFacture, form.periodeDebut, form.periodeFin, form.dateEcheance, form.ancienIndex, form.nouveauIndex, form.prixUnitaire];
    if (required.some(v => !v) || form.siteId === "" || form.fournisseurId === "") {
      setSaveError("Tous les champs sont obligatoires.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createFacture({
        numeroFacture: form.numeroFacture,
        referenceCompteur: form.referenceCompteur,
        typeReleve: form.typeReleve,
        typeEnergie: form.typeEnergie,
        siteId: form.siteId as number,
        fournisseurId: form.fournisseurId as number,
        dateFacture: form.dateFacture,
        periodeDebut: form.periodeDebut,
        periodeFin: form.periodeFin,
        dateEcheance: form.dateEcheance,
        lignesConsommation: [{
          libelleTranche: "Consommation",
          ancienIndex: Number(form.ancienIndex),
          nouveauIndex: Number(form.nouveauIndex),
          prixUnitaire: Number(form.prixUnitaire),
        }],
      });
      setShowAddModal(false);
      setForm(emptyManualForm);
      refetch();
    } catch (err: any) {
      setSaveError(err.message || "Échec de la création de la facture");
    } finally {
      setSaving(false);
    }
  };

  const filtered = invoices.filter(inv =>
    (statusFilter === "all" || statutToBadgeKey(inv.statut) === statusFilter) &&
    (typeFilter === "all" || energieToIconKey(inv.typeEnergie) === typeFilter) &&
    (inv.numeroFacture.toLowerCase().includes(search.toLowerCase()) ||
      (inv.fournisseurNom ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.siteName ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-5">
      <DemoBanner show={isDemo} />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search invoices..." value={search} onChange={setSearch}
          icon={<Search size={14} />} className="w-64" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Status</option>
          <option value="validated">Validated</option>
          <option value="pending">Pending</option>
          <option value="error">Error</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Types</option>
          <option value="electricity">Electricity</option>
          <option value="gas">Gas</option>
          <option value="water">Water</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={() => exportInvoicesCSV(filtered)}>Export</Button>
          <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => onNavigate("ocr-upload")}>
            Upload Invoice
          </Button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAddModal(true)}>Add Manual</Button>
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Nouvelle facture (saisie manuelle)" maxWidth="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Numéro de facture">
            <input value={form.numeroFacture} onChange={(e) => setForm({ ...form, numeroFacture: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
          <FormField label="Référence compteur">
            <input value={form.referenceCompteur} onChange={(e) => setForm({ ...form, referenceCompteur: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
          <FormField label="Site">
            <select value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value ? Number(e.target.value) : "" })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Sélectionner...</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Fournisseur">
            <select value={form.fournisseurId} onChange={(e) => setForm({ ...form, fournisseurId: e.target.value ? Number(e.target.value) : "" })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Sélectionner...</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom} ({f.typeEnergieFournie})</option>)}
            </select>
          </FormField>
          <FormField label="Type d'énergie">
            <select value={form.typeEnergie} onChange={(e) => setForm({ ...form, typeEnergie: e.target.value as any })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="ELECTRICITE">Électricité</option>
              <option value="GAZ">Gaz</option>
              <option value="EAU">Eau</option>
            </select>
          </FormField>
          <FormField label="Type de relevé">
            <select value={form.typeReleve} onChange={(e) => setForm({ ...form, typeReleve: e.target.value as any })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="RELEVE">Relevé réel</option>
              <option value="ESTIMATION">Estimation</option>
            </select>
          </FormField>
          <FormField label="Date de facture">
            <input type="date" value={form.dateFacture} onChange={(e) => setForm({ ...form, dateFacture: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
          <FormField label="Date d'échéance">
            <input type="date" value={form.dateEcheance} onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
          <FormField label="Début de période">
            <input type="date" value={form.periodeDebut} onChange={(e) => setForm({ ...form, periodeDebut: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
          <FormField label="Fin de période">
            <input type="date" value={form.periodeFin} onChange={(e) => setForm({ ...form, periodeFin: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
          <FormField label="Ancien index">
            <input type="number" value={form.ancienIndex} onChange={(e) => setForm({ ...form, ancienIndex: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
          <FormField label="Nouvel index">
            <input type="number" value={form.nouveauIndex} onChange={(e) => setForm({ ...form, nouveauIndex: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
          <FormField label="Prix unitaire (TND)">
            <input type="number" step="0.001" value={form.prixUnitaire} onChange={(e) => setForm({ ...form, prixUnitaire: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </FormField>
        </div>
        {saveError && <p className="text-xs text-red-600 mb-3">{saveError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>{saving ? "Création..." : "Créer"}</Button>
        </div>
      </Modal>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Invoice ID", "Supplier", "Type", "Site", "Date", "Amount", "Status", "OCR Conf.", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((inv, i) => (
                <motion.tr key={inv.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-medium text-primary">{inv.numeroFacture}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{inv.fournisseurNom}</td>
                  <td className="px-4 py-3"><EnergyIcon type={energieToIconKey(inv.typeEnergie)} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{inv.siteName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{inv.dateFacture}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">
                    {formatTND(inv.montantAPayer)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={statutToBadgeKey(inv.statut)} /></td>
                  <td className="px-4 py-3">
                    {inv.ocrConfiance != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", inv.ocrConfiance >= 90 ? "bg-green-500" : inv.ocrConfiance >= 75 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${inv.ocrConfiance}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{inv.ocrConfiance}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Saisie manuelle</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => onNavigate("invoice-detail", { id: String(inv.id) })} icon={<Eye size={12} />}>View</Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">Showing {paginated.length} of {filtered.length} invoices</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={cn("w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                  page === i + 1 ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground")}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}


export { InvoicesPage };

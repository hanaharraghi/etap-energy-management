import { useState } from "react";
import { motion } from "motion/react";
import { Filter, Plus, Zap, Flame, Droplets, TrendingUp, TrendingDown } from "lucide-react";
import { cn, Card, Button, StatusBadge, Modal, FormField } from "../components/shared";
import { DemoBanner } from "../components/DemoBanner";
import { useApiData } from "../../hooks/useApiData";
import { listSites, listRegions, createSite } from "../../lib/api";
import { demoSites, demoRegions } from "../../data/demoData";
import { formatTND } from "../../lib/display";

function SitesPage() {
  const { data: sites, isDemo, refetch } = useApiData(listSites, demoSites);
  const { data: regions } = useApiData(listRegions, demoRegions);
  const typeColors: Record<string, string> = {
    Bureau: "#005BAC", Industriel: "#F59E0B", Laboratoire: "#22C55E",
  };

  const [regionFilter, setRegionFilter] = useState<string>("all");
  const filteredSites = regionFilter === "all" ? sites : sites.filter(s => s.region === regionFilter);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ nom: "", adresse: "", reference: "", type: "Bureau", regionId: "" as number | "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!form.nom.trim() || !form.adresse.trim() || !form.reference.trim() || form.regionId === "") {
      setSaveError("Tous les champs (sauf type) sont obligatoires.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createSite({ ...form, regionId: form.regionId as number });
      setShowAddModal(false);
      setForm({ nom: "", adresse: "", reference: "", type: "Bureau", regionId: "" });
      refetch();
    } catch (err: any) {
      setSaveError(err.message || "Échec de la création du site");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <DemoBanner show={isDemo} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filteredSites.length} sites configurés</p>
        <div className="flex items-center gap-2">
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">Toutes les régions</option>
            {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAddModal(true)}>Add Site</Button>
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Nouveau site">
        <FormField label="Nom">
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </FormField>
        <FormField label="Adresse">
          <input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </FormField>
        <FormField label="Référence (unique)">
          <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </FormField>
        <FormField label="Type">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option>Bureau</option><option>Industriel</option><option>Laboratoire</option>
          </select>
        </FormField>
        <FormField label="Région">
          <select value={form.regionId} onChange={(e) => setForm({ ...form, regionId: e.target.value ? Number(e.target.value) : "" })}
            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Sélectionner...</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </FormField>
        {saveError && <p className="text-xs text-red-600 mb-3">{saveError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>{saving ? "Création..." : "Créer"}</Button>
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSites.map((site, i) => (
          <motion.div key={site.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <Card hover className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-foreground">{site.name}</h3>
                    <StatusBadge status={site.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{site.region}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-lg text-white"
                  style={{ backgroundColor: typeColors[site.type] || "#64748B" }}>
                  {site.type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {[
                  { label: "Electricity", value: site.electricity, unit: "kWh", color: "#005BAC", icon: <Zap size={10} /> },
                  { label: "Gas", value: site.gas, unit: "m³", color: "#F59E0B", icon: <Flame size={10} /> },
                  { label: "Water", value: site.water, unit: "m³", color: "#00AEEF", icon: <Droplets size={10} /> },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span style={{ color: stat.color }}>{stat.icon}</span>
                    <span className="text-xs text-muted-foreground flex-1">{stat.label}</span>
                    <span className="text-xs font-semibold text-foreground">{stat.value.toLocaleString()} {stat.unit}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Coût mensuel</div>
                  <div className="text-sm font-bold text-foreground">{formatTND(site.cost)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Dernière facture</div>
                  <div className="text-xs font-medium text-foreground">{site.lastInvoice}</div>
                </div>
                <span className={cn("text-xs font-semibold flex items-center gap-0.5",
                  site.trend >= 0 ? "text-red-600" : "text-green-600")}>
                  {site.trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(site.trend)}%
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


export { SitesPage };

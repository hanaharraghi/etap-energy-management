import { useState } from "react";
import { motion } from "motion/react";
import { Plus, ArrowUpRight, ArrowDownRight, Zap, Flame, Droplets } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn, Card, Button, SectionHeader, ChartTooltip, Modal, FormField } from "../components/shared";
import { DemoBanner } from "../components/DemoBanner";
import { Page } from "../routes";
import { useApiData } from "../../hooks/useApiData";
import { listRegions, getRegionBarData, createRegion } from "../../lib/api";
import { demoRegions, demoRegionBarData } from "../../data/demoData";
import { formatTND } from "../../lib/display";

function RegionsPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { data: regions, isDemo: demoR, refetch } = useApiData(listRegions, demoRegions);
  const { data: regionBarData, isDemo: demoB } = useApiData(getRegionBarData, demoRegionBarData);
  const isDemo = demoR || demoB;

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ nom: "", code: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!form.nom.trim() || !form.code.trim()) {
      setSaveError("Le nom et le code sont obligatoires.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createRegion(form);
      setShowAddModal(false);
      setForm({ nom: "", code: "", description: "" });
      refetch();
    } catch (err: any) {
      setSaveError(err.message || "Échec de la création de la région");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <DemoBanner show={isDemo} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{regions.length} régions suivies</p>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAddModal(true)}>
          Add Region
        </Button>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Nouvelle région">
        <FormField label="Nom">
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex. Kairouan" />
        </FormField>
        <FormField label="Code (court)">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex. KAI" maxLength={10} />
        </FormField>
        <FormField label="Description (optionnel)">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" rows={2} />
        </FormField>
        {saveError && <p className="text-xs text-red-600 mb-3">{saveError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
            {saving ? "Création..." : "Créer"}
          </Button>
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {regions.map((region, i) => (
          <motion.div key={region.id}
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}>
            <Card hover className="p-5 cursor-pointer" onClick={() => onNavigate("sites")}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: region.color }}>
                    {region.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{region.name}</h3>
                    <p className="text-xs text-muted-foreground">{region.sites} sites · {region.invoices} invoices</p>
                  </div>
                </div>
                <span className={cn("text-xs font-semibold flex items-center gap-0.5",
                  region.trend >= 0 ? "text-red-600" : "text-green-600")}>
                  {region.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(region.trend)}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Electricity", value: region.electricity, unit: "MWh", icon: <Zap size={11} />, color: "#005BAC" },
                  { label: "Gas", value: region.gas, unit: "MWh", icon: <Flame size={11} />, color: "#F59E0B" },
                  { label: "Water", value: region.water, unit: "m³", icon: <Droplets size={11} />, color: "#00AEEF" },
                ].map(stat => (
                  <div key={stat.label} className="bg-muted/60 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center mb-1" style={{ color: stat.color }}>{stat.icon}</div>
                    <div className="text-xs font-bold text-foreground">{stat.value.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">{stat.unit}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Coût total</span>
                <span className="text-sm font-bold text-foreground">{formatTND(region.cost)}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bar comparison */}
      <Card className="p-5">
        <SectionHeader title="Regional Consumption Comparison" subtitle="MWh by region — current period" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={regionBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="elec" name="Electricity" fill="#005BAC" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gas" name="Gas" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="water" name="Water" fill="#00AEEF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}


export { RegionsPage };

import { useState } from "react";
import { motion } from "motion/react";
import { Target, Gauge, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import {
  ComposedChart, Area, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { cn, Card, Button, SectionHeader, ChartTooltip } from "../components/shared";
import { DemoBanner } from "../components/DemoBanner";
import { useApiData } from "../../hooks/useApiData";
import { getPredictions, getMonthlyConsumption } from "../../lib/api";
import { demoPredictionData, demoMonthlyConsumption } from "../../data/demoData";
import { formatTND } from "../../lib/display";

function AIPredictionPage() {
  const { data: predictionData, isDemo: demoPred, refetch } = useApiData(() => getPredictions(), demoPredictionData);
  const { data: monthlyData, isDemo: demoMonth } = useApiData(getMonthlyConsumption, demoMonthlyConsumption);
  const isDemo = demoPred || demoMonth;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  };

  const futurePoints = predictionData.filter(p => p.actual == null);
  const nextPoint = futurePoints[0];
  const uncertaintyPct = nextPoint && nextPoint.predicted !== 0
    ? Math.round(((nextPoint.upper - nextPoint.lower) / nextPoint.predicted) * 100)
    : null;

  const aiKpis = [
    {
      title: "Consommation prédite", icon: <Target size={16} />, color: "#005BAC", trend: "", up: true,
      value: nextPoint ? `${nextPoint.predicted.toLocaleString("fr-TN")}` : "—",
      sub: nextPoint ? nextPoint.month : "Aucune donnée",
    },
    {
      title: "Marge d'incertitude", icon: <Gauge size={16} />, color: "#22C55E", trend: "", up: true,
      value: uncertaintyPct != null ? `±${uncertaintyPct}%` : "—",
      sub: "Intervalle de confiance 80%",
    },
    { title: "Coût estimé (mois prochain)", value: formatTND(128400), sub: "Estimation illustrative", icon: <DollarSign size={16} />, color: "#F59E0B", trend: "-2.1%", up: false },
    { title: "Niveau de risque", value: "Moyen", sub: "Approvisionnement gaz", icon: <AlertCircle size={16} />, color: "#F59E0B", trend: "", up: false },
  ];

  return (
    <div className="space-y-5">
      <DemoBanner show={isDemo} />
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {aiKpis.map((k, i) => (
          <motion.div key={k.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{k.title}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: k.color + "18" }}>
                  <span style={{ color: k.color }}>{k.icon}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{k.value}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-muted-foreground">{k.sub}</span>
                {k.trend && (
                  <span className={cn("text-xs font-semibold ml-auto", k.up ? "text-green-600" : "text-red-600")}>{k.trend}</span>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Forecast Chart */}
      <Card className="p-5">
        <SectionHeader title="Consumption Forecast" subtitle="Actual vs predicted — with confidence interval" />
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={predictionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#005BAC" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#005BAC" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine x="Dec" stroke="var(--border)" strokeDasharray="4 4" label={{ value: "Today", fontSize: 10, fill: "var(--muted-foreground)" }} />
            <Area type="monotone" dataKey="upper" name="Upper bound" fill="url(#predGrad)" stroke="transparent" />
            <Area type="monotone" dataKey="lower" name="Lower bound" fill="white" stroke="transparent" />
            <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#005BAC" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: "#22C55E", r: 4 }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Trend + Model info */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2 p-5">
          <SectionHeader title="Consumption Trend Analysis" subtitle="Monthly moving average — 2024" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="electricity" name="Electricity" fill="#005BAC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gas" name="Gas" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="water" name="Water" fill="#00AEEF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">AI Model Info</h3>
          <div className="space-y-3">
            {[
              { label: "Type de modèle", value: "Prophet + scikit-learn" },
              { label: "Données d'entraînement", value: "36 mois" },
              { label: "Variables utilisées", value: "24 variables" },
              { label: "Dernier entraînement", value: "2025-12-01" },
              { label: "Prochain entraînement", value: "2026-01-01" },
              { label: "Score RMSE", value: "0.042" },
              { label: "Score MAE", value: "0.031" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground font-mono text-xs">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="secondary" size="sm" className="w-full" icon={<RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />}
              onClick={handleRefresh} disabled={refreshing}
              title="Le modèle (Prophet) recalcule sa prévision à chaque appel à partir des dernières factures — il n'y a pas de modèle persistant séparé à réentraîner.">
              {refreshing ? "Recalcul..." : "Recalculer avec les dernières données"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}


export { AIPredictionPage };

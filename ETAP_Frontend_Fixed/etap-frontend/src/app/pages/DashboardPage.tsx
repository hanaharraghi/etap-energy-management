import { motion } from "motion/react";
import {
  Droplets, Flame, Zap, DollarSign, FileText, Bell, Brain, ArrowRight, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  cn, Card, Button, KPICard, SectionHeader, StatusBadge, EnergyIcon, ChartTooltip,
} from "../components/shared";
import { DemoBanner } from "../components/DemoBanner";
import { Page } from "../routes";
import { useApiData } from "../../hooks/useApiData";
import { listFactures } from "../../lib/api/factures";
import { listAlertes, getMonthlyConsumption, getEnergyMix, getRegionBarData } from "../../lib/api";
import { demoFactures, demoAlertes, demoMonthlyConsumption, demoEnergyMix, demoRegionBarData } from "../../data/demoData";
import { energieToIconKey, statutToBadgeKey, formatTND, formatRelativeTime } from "../../lib/display";

function DashboardPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { data: monthlyData, isDemo: demoMonthly } = useApiData(getMonthlyConsumption, demoMonthlyConsumption);
  const { data: energyMix, isDemo: demoMix } = useApiData(getEnergyMix, demoEnergyMix);
  const { data: regionBarData, isDemo: demoRegionBar } = useApiData(getRegionBarData, demoRegionBarData);
  const { data: invoices, isDemo: demoInvoices } = useApiData(listFactures, demoFactures);
  const { data: alerts, isDemo: demoAlerts } = useApiData(listAlertes, demoAlertes);
  const isDemo = demoMonthly || demoMix || demoRegionBar || demoInvoices || demoAlerts;

  const kpis = [
    { title: "Total Water", value: 12450, unit: "m³", change: 5.2, icon: <Droplets size={16} />, iconBg: "#00AEEF" },
    { title: "Total Gas", value: 8320, unit: "MWh", change: -2.1, icon: <Flame size={16} />, iconBg: "#F59E0B" },
    { title: "Total Electricity", value: 25680, unit: "MWh", change: 8.3, icon: <Zap size={16} />, iconBg: "#005BAC" },
    { title: "Total Cost", value: 1245890, unit: "$", change: 3.7, icon: <DollarSign size={16} />, iconBg: "#22C55E" },
    { title: "Invoices", value: 847, change: 12, changeLabel: "new this month", icon: <FileText size={16} />, iconBg: "#8B5CF6" },
    { title: "Active Alerts", value: 4, change: -3, changeLabel: "vs last week", icon: <Bell size={16} />, iconBg: "#EF4444" },
    { title: "AI Accuracy", value: 94, unit: "%", icon: <Brain size={16} />, iconBg: "#005BAC" },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner show={isDemo} />
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}>
            <KPICard {...k} />
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-5">
          <SectionHeader title="Monthly Consumption" subtitle="Eau, gaz et électricité — 2026" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {[["elec", "#005BAC"], ["gas", "#F59E0B"], ["water", "#00AEEF"]].map(([key, color]) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="electricity" name="Electricity" stroke="#005BAC" strokeWidth={2} fill="url(#grad-elec)" />
              <Area type="monotone" dataKey="gas" name="Gas" stroke="#F59E0B" strokeWidth={2} fill="url(#grad-gas)" />
              <Area type="monotone" dataKey="water" name="Water" stroke="#00AEEF" strokeWidth={2} fill="url(#grad-water)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Energy Mix" subtitle="By type this month" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={energyMix} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                dataKey="value" paddingAngle={3}>
                {energyMix.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {energyMix.map(e => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="text-muted-foreground">{e.name}</span>
                </div>
                <span className="font-semibold text-foreground">{e.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionHeader title="Cost Evolution" subtitle="Coût mensuel en TND — 2026" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="cost" name="Total Cost" fill="#005BAC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Consumption by Region" subtitle="Top 6 regions this month" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={regionBarData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="elec" name="Electricity" fill="#005BAC" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="gas" name="Gas" fill="#F59E0B" stackId="a" />
              <Bar dataKey="water" name="Water" fill="#00AEEF" stackId="a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent invoices & alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionHeader title="Recent Invoices" action={
            <Button variant="ghost" size="sm" onClick={() => onNavigate("invoices")}>View all <ArrowRight size={13} /></Button>
          } />
          <div className="space-y-2">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <EnergyIcon type={energieToIconKey(inv.typeEnergie)} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{inv.numeroFacture}</div>
                  <div className="text-xs text-muted-foreground">{inv.fournisseurNom} · {inv.siteName}</div>
                </div>
                <StatusBadge status={statutToBadgeKey(inv.statut)} />
                <div className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {formatTND(inv.montantAPayer)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Active Alerts" action={
            <Button variant="ghost" size="sm" onClick={() => onNavigate("alerts")}>View all <ArrowRight size={13} /></Button>
          } />
          <div className="space-y-2">
            {alerts.filter(a => a.status === "active").map(alert => (
              <div key={alert.id} className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                alert.priority === "critical" ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800/30" :
                  alert.priority === "warning" ? "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30" :
                    "bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30"
              )}>
                <AlertTriangle size={14} className={cn("mt-0.5 shrink-0",
                  alert.priority === "critical" ? "text-red-500" :
                    alert.priority === "warning" ? "text-amber-500" : "text-blue-500")} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{alert.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.message}</div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{alert.time ?? formatRelativeTime(alert.dateEnvoi)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export { DashboardPage };

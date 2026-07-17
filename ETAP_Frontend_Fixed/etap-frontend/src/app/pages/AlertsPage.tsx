import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { XCircle, AlertTriangle, Info, Building2, Clock, Check, Eye } from "lucide-react";
import { cn, Card, Badge, Button, StatusBadge } from "../components/shared";
import { DemoBanner } from "../components/DemoBanner";
import { formatRelativeTime } from "../../lib/display";
import { useApiData } from "../../hooks/useApiData";
import { listAlertes, resolveAlerte } from "../../lib/api";
import { demoAlertes } from "../../data/demoData";

function AlertsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [priority, setPriority] = useState("all");
  const { data: alerts, isDemo, refetch } = useApiData(listAlertes, demoAlertes);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const handleResolve = async (id: number) => {
    setResolvingId(id);
    try {
      await resolveAlerte(id);
      refetch();
    } catch (err) {
      console.error("Failed to resolve alert", err);
    } finally {
      setResolvingId(null);
    }
  };

  const filtered = alerts.filter(a =>
    (filter === "all" || a.status === filter) &&
    (priority === "all" || a.priority === priority)
  );

  const priorities: Record<string, any> = {
    critical: { label: "Critical", color: "text-red-600", bg: "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800/30", icon: <XCircle size={15} className="text-red-500" /> },
    warning: { label: "Warning", color: "text-amber-600", bg: "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30", icon: <AlertTriangle size={15} className="text-amber-500" /> },
    info: { label: "Info", color: "text-blue-600", bg: "bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30", icon: <Info size={15} className="text-blue-500" /> },
  };

  return (
    <div className="space-y-5">
      <DemoBanner show={isDemo} />
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Critical", count: alerts.filter(a => a.priority === "critical" && a.status === "active").length, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/10" },
          { label: "Warning", count: alerts.filter(a => a.priority === "warning" && a.status === "active").length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" },
          { label: "Resolved", count: alerts.filter(a => a.status === "resolved").length, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/10" },
        ].map(s => (
          <Card key={s.label} className={cn("p-4 text-center", s.bg)}>
            <div className={cn("text-3xl font-bold", s.color)}>{s.count}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label} Alerts</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex bg-muted rounded-xl p-1">
          {(["all", "active", "resolved"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>
        <select value={priority} onChange={e => setPriority(e.target.value)}
          className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {filtered.map((alert, i) => {
          const p = priorities[alert.priority ?? "info"] || priorities.info;
          return (
            <motion.div key={alert.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <Card className={cn("p-4 border", p.bg)}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{p.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                      <Badge variant={alert.priority === "critical" ? "danger" : alert.priority === "warning" ? "warning" : "info"}>
                        {p.label}
                      </Badge>
                      <StatusBadge status={alert.status ?? "active"} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 size={11} />{alert.site}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{alert.time ?? formatRelativeTime(alert.dateEnvoi)}</span>
                      <Badge variant="default" className="text-[10px]">{alert.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {alert.status === "active" && (
                      <Button variant="ghost" size="sm" icon={<Check size={12} />}
                        onClick={() => handleResolve(alert.id)} disabled={resolvingId === alert.id}>
                        {resolvingId === alert.id ? "..." : "Resolve"}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" icon={<Eye size={12} />}
                      disabled={!alert.factureId}
                      onClick={() => alert.factureId && navigate(`/invoice-detail?id=${alert.factureId}`)}>
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


export { AlertsPage };

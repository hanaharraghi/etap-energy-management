import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, Clock, Zap, Droplets, Flame, X,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

export const cn = (...inputs: any[]) => twMerge(clsx(inputs));

// ─── Custom Hooks ───────────────────────────────────────────────────────────
export function useAnimatedCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ─── Base UI Components ─────────────────────────────────────────────────────
export function Button({
  children, variant = "primary", size = "md", className = "", onClick, disabled, icon, type = "button", title
}: {
  children?: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg"; className?: string; onClick?: () => void; disabled?: boolean;
  icon?: React.ReactNode; type?: "button" | "submit"; title?: string;
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-sm shadow-primary/20",
    secondary: "bg-secondary text-secondary-foreground hover:bg-accent border border-border",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
    outline: "border border-border text-foreground hover:bg-muted",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={cn(base, variants[variant], sizes[size], className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function Badge({ children, variant = "default", className = "" }: {
  children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
  className?: string;
}) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    secondary: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function Card({ children, className = "", onClick, hover = false, onDragOver, onDragLeave, onDrop }: {
  children: React.ReactNode; className?: string; onClick?: () => void; hover?: boolean;
  onDragOver?: (e: React.DragEvent) => void; onDragLeave?: (e: React.DragEvent) => void; onDrop?: (e: React.DragEvent) => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      whileHover={hover ? { y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" } : undefined}
      className={cn(
        "bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm",
        hover && "cursor-pointer",
        className
      )}>
      {children}
    </motion.div>
  );
}

export function Input({ placeholder, value, onChange, icon, className = "", type = "text" }: {
  placeholder?: string; value?: string; onChange?: (v: string) => void;
  icon?: React.ReactNode; className?: string; type?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className={cn(
          "w-full bg-muted border border-border rounded-xl py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
          icon ? "pl-9 pr-4" : "px-4"
        )}
      />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cn("bg-muted rounded-lg animate-pulse", className)} />
  );
}

export function Avatar({ initials, size = "md", color = "#005BAC" }: { initials: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sizes[size])}
      style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

// ─── Chart Tooltip ──────────────────────────────────────────────────────────
export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}: <span className="font-medium text-foreground">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span></span>
        </div>
      ))}
    </div>
  );
}

// ─── Animated KPI Card ──────────────────────────────────────────────────────
export function KPICard({ title, value, unit, change, changeLabel, icon, iconBg, trend, loading = false }: {
  title: string; value: number; unit?: string; change?: number;
  changeLabel?: string; icon: React.ReactNode; iconBg: string; trend?: "up" | "down"; loading?: boolean;
}) {
  const animated = useAnimatedCounter(value);
  return (
    <Card className="relative overflow-hidden">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-36" /><Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center")} style={{ backgroundColor: iconBg + "18" }}>
              <span style={{ color: iconBg }}>{icon}</span>
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {unit === "$" && "$"}{animated.toLocaleString()}{unit && unit !== "$" && <span className="text-sm font-medium text-muted-foreground ml-1">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0
                ? <ArrowUpRight size={13} className="text-green-500" />
                : <ArrowDownRight size={13} className="text-red-500" />}
              <span className={cn("text-xs font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-muted-foreground">{changeLabel || "vs last month"}</span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Status Badge for invoices ──────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    validated: { variant: "success", label: "Validated", icon: <CheckCircle size={10} /> },
    pending: { variant: "warning", label: "Pending", icon: <Clock size={10} /> },
    error: { variant: "danger", label: "Error", icon: <XCircle size={10} /> },
    active: { variant: "success", label: "Active", icon: <CheckCircle size={10} /> },
    inactive: { variant: "default", label: "Inactive", icon: <XCircle size={10} /> },
    maintenance: { variant: "warning", label: "Maintenance", icon: <Clock size={10} /> },
    resolved: { variant: "default", label: "Resolved", icon: <CheckCircle size={10} /> },
  };
  const s = map[status] || { variant: "default", label: status, icon: null };
  return <Badge variant={s.variant}>{s.icon}{s.label}</Badge>;
}

// ─── Energy Type Icon ───────────────────────────────────────────────────────
export function EnergyIcon({ type }: { type: string }) {
  if (type === "electricity") return <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center dark:bg-blue-900/20"><Zap size={13} className="text-blue-600" /></div>;
  if (type === "water") return <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center dark:bg-sky-900/20"><Droplets size={13} className="text-sky-600" /></div>;
  if (type === "gas") return <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center dark:bg-amber-900/20"><Flame size={13} className="text-amber-600" /></div>;
  return null;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={cn("relative w-full bg-card rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto", maxWidth)}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

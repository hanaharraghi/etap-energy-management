import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, FileText, Upload, Brain, Bell, Building2,
  Users, Settings, ChevronRight, Moon, Sun, PanelLeft, MapPinned, LogOut, Zap,
} from "lucide-react";
import { cn, Avatar } from "../components/shared";
import { Page, pageToPath } from "../routes";
import keycloak, { getCurrentUser } from "../../lib/keycloak";

// ─── Sidebar ────────────────────────────────────────────────────────────────
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { id: "invoices", label: "Invoices", icon: <FileText size={17} /> },
  { id: "ocr-upload", label: "OCR Upload", icon: <Upload size={17} /> },
  { id: "ai-prediction", label: "AI Predictions", icon: <Brain size={17} /> },
  { id: "alerts", label: "Alerts", icon: <Bell size={17} />, badge: 4 },
  { id: "regions", label: "Regions", icon: <MapPinned size={17} /> },
  { id: "sites", label: "Sites", icon: <Building2 size={17} /> },
  { id: "users", label: "Users", icon: <Users size={17} />, roles: ["ADMIN", "RESPONSABLE_REGIONAL"] },
  { id: "settings", label: "Settings", icon: <Settings size={17} /> },
];

function Sidebar({ current, onNavigate, collapsed, onToggle, darkMode, onDarkMode }: {
  current: Page; onNavigate: (p: Page) => void;
  collapsed: boolean; onToggle: () => void;
  darkMode: boolean; onDarkMode: (v: boolean) => void;
}) {
  const user = getCurrentUser();
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur",
    AGENT: "Agent",
    RESPONSABLE_REGIONAL: "Responsable régional",
  };
  const primaryRole = user?.roles[0] ? roleLabels[user.roles[0]] ?? user.roles[0] : "—";
  const initials = user?.fullName
    ? user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 228 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden z-20 print:hidden"
      style={{ minWidth: collapsed ? 64 : 228 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap size={15} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="overflow-hidden whitespace-nowrap">
              <div className="text-sm font-bold text-foreground leading-tight">ETAP EMS</div>
              <div className="text-[10px] text-muted-foreground font-medium">Energy Management</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.filter(item => !item.roles || item.roles.some(r => user?.roles?.includes(r as any))).map(item => {
          const active = current === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-100 relative group",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
              <span className="shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-nowrap flex-1 text-left">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !collapsed && (
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  active ? "bg-white/20 text-white" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400")}>
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-2 space-y-1 shrink-0">
        <button onClick={() => onDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all">
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          {!collapsed && <span className="text-sm font-medium">{darkMode ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        <button onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all">
          <PanelLeft size={17} className={cn("transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <Avatar initials={initials} size="sm" color="#005BAC" />
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold text-foreground truncate">{user?.fullName || "Utilisateur"}</div>
              <div className="text-[10px] text-muted-foreground">{primaryRole}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
              title="Se déconnecter"
              className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

// ─── Top Nav ────────────────────────────────────────────────────────────────
function TopNav({ title, breadcrumbs, onNavigate, actions }: {
  title: string; breadcrumbs?: { label: string; page?: Page }[];
  onNavigate?: (p: Page) => void; actions?: React.ReactNode;
}) {
  const user = getCurrentUser();
  const initials = user?.fullName
    ? user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 shrink-0 print:hidden">
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} />}
                {b.page
                  ? <button onClick={() => onNavigate?.(b.page!)} className="hover:text-foreground transition-colors">{b.label}</button>
                  : <span className="text-foreground font-medium">{b.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell size={16} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <Avatar initials={initials} size="sm" color="#005BAC" />
      </div>
    </header>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────
function AppLayout({ children, current, onNavigate, darkMode, onDarkMode, title, breadcrumbs, actions }: {
  children: React.ReactNode; current: Page; onNavigate: (p: Page) => void;
  darkMode: boolean; onDarkMode: (v: boolean) => void;
  title: string; breadcrumbs?: { label: string; page?: Page }[]; actions?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar current={current} onNavigate={onNavigate} collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)} darkMode={darkMode} onDarkMode={onDarkMode} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav title={title} breadcrumbs={breadcrumbs} onNavigate={onNavigate} actions={actions} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <motion.div key={current} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export { AppLayout };

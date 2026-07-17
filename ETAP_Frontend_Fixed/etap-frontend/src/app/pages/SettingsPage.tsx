import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell, Brain, CheckCircle, Code, Copy, Key, Moon, Plus, RefreshCw, Scan, Shield, Sun, User,
  ExternalLink, Globe, Cpu, XCircle,
} from "lucide-react";
import { cn, Card, Button, Badge, StatusBadge, Avatar } from "../components/shared";
import { getCurrentUser } from "../../lib/keycloak";

function SettingsPage({ darkMode, onDarkMode }: { darkMode: boolean; onDarkMode: (v: boolean) => void }) {
  const [activeTab, setActiveTab] = useState("profile");
  const user = getCurrentUser();
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur",
    AGENT: "Agent",
    RESPONSABLE_REGIONAL: "Responsable régional",
  };
  const initials = user?.fullName
    ? user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const kcUrl = import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8085";
  const kcRealm = import.meta.env.VITE_KEYCLOAK_REALM || "etap";
  const keycloakAccountUrl = `${kcUrl}/realms/${kcRealm}/account`;
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");

  const testKeycloakConnection = async () => {
    setConnectionStatus("checking");
    try {
      const res = await fetch(`${kcUrl}/realms/${kcRealm}/.well-known/openid-configuration`);
      setConnectionStatus(res.ok ? "ok" : "fail");
    } catch {
      setConnectionStatus("fail");
    }
  };
  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={14} /> },
    { id: "theme", label: "Theme", icon: <Sun size={14} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
    { id: "security", label: "Security", icon: <Shield size={14} /> },
    { id: "api", label: "API Config", icon: <Code size={14} /> },
    { id: "ai", label: "AI Config", icon: <Brain size={14} /> },
    { id: "ocr", label: "OCR Config", icon: <Scan size={14} /> },
  ];

  const content: Record<string, React.ReactNode> = {
    profile: (
      <div className="space-y-5">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Informations personnelles</h3>
          <div className="flex items-center gap-4 mb-6">
            <Avatar initials={initials} size="lg" color="#005BAC" />
            <div>
              <div className="text-base font-semibold text-foreground">{user?.fullName || "Utilisateur"}</div>
              <div className="text-sm text-muted-foreground">{user?.roles[0] ? roleLabels[user.roles[0]] : "—"}</div>
            </div>
            <Button variant="outline" size="sm" className="ml-auto"
              onClick={() => keycloakAccountUrl && window.open(keycloakAccountUrl, "_blank")}
              icon={<ExternalLink size={13} />}>
              Gérer le profil dans Keycloak
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Prénom", value: user?.firstName || "—" },
              { label: "Nom", value: user?.lastName || "—" },
              { label: "Email", value: user?.email || "—" },
              { label: "Rôle", value: user?.roles[0] ? roleLabels[user.roles[0]] : "—" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{f.label}</label>
                <input defaultValue={f.value} readOnly
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Ces informations proviennent de Keycloak. Pour les modifier, utilisez le bouton ci-dessus.
          </p>
        </Card>
      </div>
    ),
    theme: (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-primary" />}
              <div>
                <div className="text-sm font-medium text-foreground">Dark Mode</div>
                <div className="text-xs text-muted-foreground">Switch between light and dark theme</div>
              </div>
            </div>
            <button onClick={() => onDarkMode(!darkMode)}
              className={cn("w-10 h-5 rounded-full transition-colors relative", darkMode ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                darkMode ? "translate-x-5" : "translate-x-0.5")} />
            </button>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <div className="text-sm font-medium text-foreground mb-3">Primary Color</div>
            <div className="flex items-center gap-2">
              {["#005BAC", "#00AEEF", "#22C55E", "#8B5CF6", "#EF4444", "#F59E0B"].map(c => (
                <button key={c} className="w-8 h-8 rounded-xl border-2 border-transparent hover:border-foreground/30 transition-all"
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </Card>
    ),
    notifications: (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { label: "Critical Alerts", sub: "Immediate notification for critical issues", enabled: true },
            { label: "Invoice Validation", sub: "When new invoices require review", enabled: true },
            { label: "AI Predictions", sub: "Monthly AI prediction reports", enabled: false },
            { label: "Budget Threshold", sub: "When consumption exceeds budget", enabled: true },
            { label: "System Updates", sub: "Platform updates and maintenance", enabled: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
              <div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sub}</div>
              </div>
              <div className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                item.enabled ? "bg-primary" : "bg-muted")}>
                <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                  item.enabled ? "translate-x-5" : "translate-x-0.5")} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    ),
    security: (
      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Configuration Keycloak</h3>
          <div className="space-y-3">
            {[
              { label: "Realm", value: kcRealm },
              { label: "Client ID", value: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "react-client" },
              { label: "Server URL", value: kcUrl },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 shrink-0">{f.label}</span>
                <code className="flex-1 px-3 py-1.5 bg-muted rounded-lg text-xs font-mono text-foreground border border-border">
                  {f.value}
                </code>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />} onClick={testKeycloakConnection}>
              Tester la connexion
            </Button>
            {connectionStatus === "ok" && <Badge variant="success"><CheckCircle size={10} />Connecté</Badge>}
            {connectionStatus === "fail" && <Badge variant="danger"><XCircle size={10} />Injoignable</Badge>}
            {connectionStatus === "checking" && <Badge variant="info">Vérification...</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Ces valeurs sont configurées via les variables d'environnement <code className="font-mono">VITE_KEYCLOAK_*</code> au build du frontend, pas modifiables ici.
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Mot de passe et sécurité du compte</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Le mot de passe, l'authentification à deux facteurs et les sessions actives sont gérés directement par Keycloak, pas par cette application.
          </p>
          <Button variant="primary" size="sm" icon={<ExternalLink size={13} />}
            onClick={() => window.open(keycloakAccountUrl, "_blank")}>
            Ouvrir la console de compte Keycloak
          </Button>
        </Card>
      </div>
    ),
    api: (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Configuration des services backend</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
              <Globe size={12} /> URL de l'API (NestJS)
            </label>
            <code className="block w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm font-mono text-foreground">
              {import.meta.env.VITE_API_URL || "non configurée — mode démo actif"}
            </code>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
              <Cpu size={12} /> URL du service IA (FastAPI)
            </label>
            <code className="block w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm font-mono text-foreground">
              {import.meta.env.VITE_AI_SERVICE_URL || "appelée par le backend, non exposée au frontend"}
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            Ces URLs sont définies via <code className="font-mono">.env</code> au build (variables <code className="font-mono">VITE_*</code>) — voir le README du scaffold d'infrastructure.
          </p>
        </div>
      </Card>
    ),
    ai: (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">AI Model Configuration</h3>
        <div className="space-y-4">
          {[
            { label: "Prediction Horizon", type: "select", options: ["1 month", "3 months", "6 months"], value: "3 months" },
            { label: "Confidence Threshold", type: "number", value: "85" },
            { label: "Retraining Frequency", type: "select", options: ["Weekly", "Monthly", "Quarterly"], value: "Monthly" },
            { label: "Anomaly Detection Sensitivity", type: "select", options: ["Low", "Medium", "High"], value: "Medium" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{f.label}</label>
              {f.type === "select" ? (
                <select defaultValue={f.value}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {f.options?.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type="number" defaultValue={f.value}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              )}
            </div>
          ))}
          <Button variant="primary" size="sm" disabled title="Ces réglages ne sont pas encore branchés au microservice IA — le modèle utilise ses valeurs par défaut pour l'instant.">
            Save AI Configuration
          </Button>
          <p className="text-xs text-muted-foreground">
            Non connecté au backend pour le moment : le microservice IA (FastAPI) ne lit pas encore ces valeurs dynamiquement.
          </p>
        </div>
      </Card>
    ),
    ocr: (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">OCR Engine Configuration</h3>
        <div className="space-y-4">
          {[
            { label: "OCR Engine", type: "select", options: ["Tesseract v5", "Google Vision", "Azure OCR", "AWS Textract"], value: "Tesseract v5" },
            { label: "Minimum Confidence Threshold (%)", type: "number", value: "70" },
            { label: "Language", type: "select", options: ["Arabic", "French", "English", "Auto-detect"], value: "Auto-detect" },
            { label: "Max File Size (MB)", type: "number", value: "20" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{f.label}</label>
              {f.type === "select" ? (
                <select defaultValue={f.value}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {f.options?.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type="number" defaultValue={f.value}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              )}
            </div>
          ))}
          <Button variant="primary" size="sm" disabled title="Le moteur OCR (Tesseract.js) et ses paramètres sont actuellement fixés côté backend.">
            Save OCR Configuration
          </Button>
          <p className="text-xs text-muted-foreground">
            Non connecté au backend pour le moment : ces valeurs sont actuellement fixées dans le code du service OCR.
          </p>
        </div>
      </Card>
    ),
  };

  return (
    <div className="flex gap-6">
      {/* Tabs sidebar */}
      <div className="w-48 shrink-0">
        <nav className="space-y-0.5">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                activeTab === tab.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>
            {content[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export { SettingsPage };

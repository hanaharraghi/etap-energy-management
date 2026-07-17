import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router";
import AuthGate from "./AuthGate";
import { AppLayout } from "./layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { OcrUploadPage } from "./pages/OcrUploadPage";
import { AIPredictionPage } from "./pages/AIPredictionPage";
import { AlertsPage } from "./pages/AlertsPage";
import { RegionsPage } from "./pages/RegionsPage";
import { SitesPage } from "./pages/SitesPage";
import { UsersPage } from "./pages/UsersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Page, pageToPath, pathToPage } from "./routes";

const pageConfig: Record<Page, { title: string; breadcrumbs: { label: string; page?: Page }[] }> = {
  dashboard: { title: "Tableau de bord", breadcrumbs: [{ label: "Tableau de bord" }] },
  invoices: { title: "Gestion des factures", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Factures" }] },
  "invoice-detail": { title: "Détail de la facture", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Factures", page: "invoices" }, { label: "Détail" }] },
  "ocr-upload": { title: "Import OCR de factures", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Import OCR" }] },
  "ai-prediction": { title: "Prédictions IA", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Prédictions IA" }] },
  alerts: { title: "Alertes & notifications", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Alertes" }] },
  regions: { title: "Régions", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Régions" }] },
  sites: { title: "Sites", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Sites" }] },
  users: { title: "Gestion des utilisateurs", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Utilisateurs" }] },
  settings: { title: "Paramètres", breadcrumbs: [{ label: "Tableau de bord", page: "dashboard" }, { label: "Paramètres" }] },
};

function Shell() {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const current = pathToPage(location.pathname);

  const handleDarkMode = (v: boolean) => {
    setDarkMode(v);
    if (v) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const goTo = (p: Page, params?: Record<string, string>) => {
    const search = params ? `?${new URLSearchParams(params).toString()}` : "";
    navigate(`${pageToPath(p)}${search}`);
  };

  const { title, breadcrumbs } = pageConfig[current] ?? pageConfig.dashboard;

  return (
    <div className={darkMode ? "dark" : ""}>
      <AppLayout
        current={current}
        onNavigate={goTo}
        darkMode={darkMode}
        onDarkMode={handleDarkMode}
        title={title}
        breadcrumbs={breadcrumbs}
      >
        <Routes>
          <Route path="/" element={<DashboardPage onNavigate={goTo} />} />
          <Route path="/invoices" element={<InvoicesPage onNavigate={goTo} />} />
          <Route path="/invoice-detail" element={<InvoiceDetailPage onNavigate={goTo} />} />
          <Route path="/ocr-upload" element={<OcrUploadPage />} />
          <Route path="/ai-prediction" element={<AIPredictionPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/regions" element={<RegionsPage onNavigate={goTo} />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage darkMode={darkMode} onDarkMode={handleDarkMode} />} />
        </Routes>
      </AppLayout>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthGate>
  );
}

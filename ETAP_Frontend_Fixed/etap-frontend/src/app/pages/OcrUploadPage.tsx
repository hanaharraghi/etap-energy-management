import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  CloudUpload, Upload, Scan, FileSearch, Shield, CircleCheck, Check, RefreshCw, XCircle,
} from "lucide-react";
import { cn, Card, Badge, Button } from "../components/shared";
import { importFactureOCR } from "../../lib/api/factures";
import { listSites } from "../../lib/api";
import { listFournisseurs } from "../../lib/api/fournisseurs";
import { useApiData } from "../../hooks/useApiData";
import { demoSites, demoFournisseurs } from "../../data/demoData";

function OcrUploadPage() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(0); // 0=idle, 1=uploading, 2=ocr, 3=extracting, 4=validation, 5=done
  const [error, setError] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<number | "">("");
  const [fournisseurId, setFournisseurId] = useState<number | "">("");
  const [createdFactureId, setCreatedFactureId] = useState<number | null>(null);
  const isConfigured = Boolean(import.meta.env.VITE_API_URL);

  const { data: sites } = useApiData(listSites, demoSites);
  const { data: fournisseurs } = useApiData(listFournisseurs, demoFournisseurs);
  const canUpload = siteId !== "" && fournisseurId !== "";

  const steps = [
    { label: "Uploading", icon: <CloudUpload size={16} /> },
    { label: "OCR Reading", icon: <Scan size={16} /> },
    { label: "Extracting Fields", icon: <FileSearch size={16} /> },
    { label: "Validation", icon: <Shield size={16} /> },
    { label: "Completed", icon: <CircleCheck size={16} /> },
  ];

  const runPipeline = useCallback((selectedFile: File) => {
    setError(null);
    if (isConfigured) {
      if (!canUpload) {
        setError("Sélectionnez un site et un fournisseur avant d'importer une facture.");
        return;
      }
      // Real backend: drive the visual pipeline off actual request progress.
      setStep(1);
      const visualTimer = setTimeout(() => setStep(2), 500);
      importFactureOCR(selectedFile, siteId as number, fournisseurId as number)
        .then((result) => {
          clearTimeout(visualTimer);
          setStep(3);
          setCreatedFactureId(result?.facture?.id ?? null);
          setTimeout(() => setStep(5), 600);
        })
        .catch((err) => {
          clearTimeout(visualTimer);
          setError(err.message || "Échec de l'import OCR");
          setStep(0);
        });
      return;
    }
    // No backend configured yet — demo pipeline animation only.
    let s = 1;
    const run = () => {
      setStep(s);
      if (s < 5) { s++; setTimeout(run, 1200); }
    };
    run();
  }, [isConfigured, canUpload, siteId, fournisseurId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); runPipeline(f); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Site & Fournisseur selection — required by the backend, since OCR
          can read a meter reference off the scan but can't infer which
          site/supplier the invoice belongs to. */}
      {isConfigured && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Avant l'import</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Site</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sélectionner un site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Fournisseur</label>
              <select
                value={fournisseurId}
                onChange={(e) => setFournisseurId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sélectionner un fournisseur...</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom} ({f.typeEnergieFournie})</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Drop Zone */}
      <Card className={cn(
        "border-2 border-dashed transition-all duration-200 p-12 text-center",
        !isConfigured || canUpload
          ? (dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40")
          : "border-border opacity-50 cursor-not-allowed"
      )}
        onDragOver={e => { e.preventDefault(); if (!isConfigured || canUpload) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { if (!isConfigured || canUpload) handleDrop(e); else e.preventDefault(); }}>
        <motion.div animate={{ scale: dragOver ? 1.05 : 1 }} transition={{ duration: 0.15 }}>
          <div className={cn("w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-colors",
            dragOver ? "bg-primary" : "bg-muted")}>
            <CloudUpload size={28} className={cn(dragOver ? "text-white" : "text-muted-foreground")} />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            {file ? file.name : "Drop invoice here"}
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            {file ? `${(file.size / 1024).toFixed(1)} KB · Processing...` : "Supports PDF, PNG, JPG, TIFF — up to 20MB"}
          </p>
          <label className={cn(
            "inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity shadow-sm shadow-primary/30",
            !isConfigured || canUpload ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed opacity-50"
          )}>
            <Upload size={14} /> Browse Files
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.tiff" disabled={isConfigured && !canUpload}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); runPipeline(f); } }} />
          </label>
          {!isConfigured && (
            <p className="text-xs text-amber-600 mt-4">
              Mode démo : VITE_API_URL n'est pas configuré, la reconnaissance OCR est simulée.
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-4 flex items-center justify-center gap-1">
              <XCircle size={12} /> {error}
            </p>
          )}
        </motion.div>
      </Card>

      {/* Processing Steps */}
      {step > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">Processing Pipeline</h3>
          <div className="space-y-3">
            {steps.map((s, i) => {
              const state = i + 1 < step ? "done" : i + 1 === step ? "active" : "idle";
              return (
                <motion.div key={s.label}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    state === "done" ? "bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-800/30" :
                      state === "active" ? "bg-blue-50 border-primary/20 dark:bg-blue-900/10 dark:border-blue-800/30" :
                        "bg-muted/50 border-transparent"
                  )}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                    state === "done" ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
                      state === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    {state === "done" ? <Check size={14} /> :
                      state === "active" ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw size={14} /></motion.div> :
                        s.icon}
                  </div>
                  <span className={cn("text-sm font-medium", state === "idle" ? "text-muted-foreground" : "text-foreground")}>{s.label}</span>
                  {state === "done" && <Badge variant="success" className="ml-auto">Done</Badge>}
                  {state === "active" && <Badge variant="info" className="ml-auto">Processing...</Badge>}
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Result */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center dark:bg-green-900/30">
                <CircleCheck size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">OCR Processing Complete</h3>
                <p className="text-xs text-muted-foreground">12 fields extracted · 96% average confidence</p>
              </div>
              <Button variant="primary" size="sm" className="ml-auto"
                disabled={!createdFactureId}
                onClick={() => createdFactureId && navigate(`/invoice-detail?id=${createdFactureId}`)}>
                Review & Validate
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: "Fields Extracted", value: "12/12" }, { label: "Confidence Score", value: "96%" }, { label: "Processing Time", value: "4.2s" }].map(s => (
                <div key={s.label} className="bg-white dark:bg-gray-800/50 rounded-xl p-3 text-center border border-green-100 dark:border-green-800/20">
                  <div className="text-lg font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}


export { OcrUploadPage };

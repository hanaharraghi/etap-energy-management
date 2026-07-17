export type Page =
  | "dashboard" | "invoices" | "invoice-detail"
  | "ocr-upload" | "ai-prediction" | "alerts" | "regions"
  | "sites" | "users" | "settings";

export type NavigateFn = (p: Page, params?: Record<string, string>) => void;

export const pageToPath = (page: Page): string => (page === "dashboard" ? "/" : `/${page}`);

export const pathToPage = (path: string): Page => {
  const clean = path.replace(/^\//, "") as Page | "";
  return clean === "" ? "dashboard" : (clean as Page);
};

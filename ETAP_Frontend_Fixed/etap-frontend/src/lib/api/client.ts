import keycloak from "../keycloak";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper: attaches the current Keycloak access token, throws
 * ApiError on non-2xx responses, and returns parsed JSON.
 *
 * NOTE: this intentionally does NOT silently swallow errors. Each page
 * decides whether to fall back to demo data (see src/data/demoData.ts) —
 * that decision shouldn't be hidden inside a shared client.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("VITE_API_URL is not configured", 0);
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (keycloak.token) {
    headers.set("Authorization", `Bearer ${keycloak.token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(body || res.statusText, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Wraps an API call with a demo-data fallback. Used throughout the app so
 * every page works out of the box against the Tunisian demo dataset, and
 * automatically switches to the real backend the moment VITE_API_URL points
 * to a running NestJS instance.
 */
export async function withFallback<T>(loader: () => Promise<T>, fallback: T): Promise<{ data: T; usedFallback: boolean }> {
  if (!API_URL) return { data: fallback, usedFallback: true };
  try {
    const data = await loader();
    return { data, usedFallback: false };
  } catch (err) {
    console.warn("API call failed, falling back to demo data:", err);
    return { data: fallback, usedFallback: true };
  }
}

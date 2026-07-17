# ETAP Frontend

React + TypeScript frontend for the ETAP energy management system, rebuilt on
top of the original Figma Make export to actually run against the real stack:
**Keycloak** (auth), **NestJS** (API), **Prisma/PostgreSQL** (data), with a
**Tunisian demo dataset** (STEG/SONEDE) as a fallback when no backend is
configured yet.

## Button audit — every non-functional button, found and fixed (latest update)

A systematic pass found every `<Button>` across the app missing an
`onClick`, then fixed each based on what's actually feasible:

| Button | Fix |
|---|---|
| Regions "Add Region" | Real modal → `POST /regions` (new backend endpoint) |
| Sites "Add Site" | Real modal → `POST /sites` (new backend endpoint) |
| Sites "Filter" | Real region dropdown filter (client-side) |
| Invoices "Add Manual" | Real modal with consumption/index fields → `POST /factures` (new backend endpoint) |
| Invoices "Export" | Real client-side CSV export of the current filtered list |
| Invoice detail "Export PDF" | Wired to `window.print()` with print CSS hiding the sidebar/nav — a real, zero-dependency PDF path via the browser's print dialog |
| Invoice detail "Validate"/"Reject" | Wired to `PATCH /factures/:id/statut`, role-gated to `ADMIN`/`RESPONSABLE_REGIONAL` matching the backend guard |
| OCR "Review & Validate" | Now navigates to the invoice actually created by the import |
| Alerts "Resolve" | Wired to `PATCH /alertes/:id/resolve` (new backend endpoint) |
| Alerts "Details" | Navigates to the related invoice (backend now includes `factureId` in the alert response) |
| Users "Edit" | Deep-links to that specific user in Keycloak's admin console |
| Users kebab menu (⋯) | Removed — it had no defined actions, so it was a dead end dressed up as a button |
| AI Prediction "Retrain Model" | Relabeled honestly — neither model in the AI service persists a trained artifact to retrain (both fit fresh per request), so this now triggers a real refetch against live data rather than pretending to kick off a training job that doesn't exist |
| Settings "Save AI/OCR Configuration" | Explicitly disabled with a tooltip explaining why, rather than faking persistence that doesn't affect any real backend behavior |

## Wired to the real NestJS backend (latest update)

These were real gaps found while actually connecting to the backend that now
exists, not just theoretical cleanup:

| Gap | Fix |
|---|---|
| OCR import never sent `siteId`/`fournisseurId`, which the backend requires as query params (it can't infer them from the scan alone) | `importFactureOCR()` now takes both, and the OCR upload page has a site/supplier selector shown whenever a real backend is configured |
| The multipart OCR upload used a raw `fetch()` that never attached the Keycloak bearer token — the backend's auth guard would have rejected every request with 401 | Now attaches `Authorization: Bearer <token>` like every other API call |
| No `Fournisseur` API module existed at all | Added `src/lib/api/fournisseurs.ts` |
| The "Validate" button on the invoice detail page was purely decorative — no `onClick`, never called the backend | Wired to `PATCH /factures/:id/statut`, added a "Reject" action with a reason prompt, both gated to `ADMIN`/`RESPONSABLE_REGIONAL` matching the backend's `@Roles(...)` guard exactly |
| The sidebar showed "Users" to every role, but the backend restricts `GET /utilisateurs` to `ADMIN`/`RESPONSABLE_REGIONAL` — an `AGENT` would've hit a 403 | Nav item now hidden for roles that can't access it |
| Alert "time ago" text was hardcoded demo copy; the real backend doesn't (and shouldn't) store a static string for something that's always relative to *now* | Added `formatRelativeTime()`, computed client-side from the real `dateEnvoi` timestamp |
| `useApiData` had no way to reload after a mutation (e.g. after validating an invoice, the page kept showing stale data) | Added `refetch()` to the hook |



## Data model

`src/types/models.ts` mirrors `prisma/schema.prisma` from the infra scaffold
(`Facture`, `Fournisseur`, `LigneConsommation`, `Taxe`, `Anomalie`, `Alerte`,
`Prediction`, etc.) — keep the two in sync as the backend evolves.

## Demo mode vs. live mode

Every page calls a function from `src/lib/api/` (e.g. `listFactures()`), which:

1. If `VITE_API_URL` is set, calls the real NestJS backend with the current
   Keycloak access token attached.
2. If that call fails (or `VITE_API_URL` is empty), falls back to the
   Tunisian demo dataset in `src/data/demoData.ts` and shows a small amber
   "Données de démonstration" banner at the top of the page.

This means the app is fully clickable today, and the moment your backend is
up and `VITE_API_URL` points to it, every page switches to live data with no
code changes.

## Setup

**macOS/Linux:**
```bash
cp .env.example .env.local
npm install
npm run dev
```

**Windows (Command Prompt):**
```cmd
copy .env.example .env.local
npm install
npm run dev
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

(`cp` is a Unix command and doesn't exist in `cmd.exe` — use `copy` there, or `Copy-Item` in PowerShell.)

Fill in `.env.local` to match your Keycloak realm (see the
`etap-infra-scaffold.zip` from earlier — `keycloak/realm-export.json` defines
the exact realm/client/roles this app expects: realm `etap`, client
`etap-frontend`, roles `ADMIN` / `AGENT` / `RESPONSABLE_REGIONAL`).

**Keycloak must be running and reachable at `VITE_KEYCLOAK_URL` for the app
to load at all** — `AuthGate` blocks rendering until a valid session exists,
by design (this is not a page you can skip, unlike the old fake login).

## Verified

- `npx tsc --noEmit` — passes with no errors.
- `npm run build` — clean production build.
- All 10 routes were smoke-tested in a headless browser with zero runtime
  JavaScript errors, and dashboard output was checked to confirm real
  STEG/SONEDE/Tunisian content renders (no leftover Algerian mock data).
- Not verified end-to-end against a live Keycloak/NestJS instance (none was
  available in this environment) — do that as your next step once the
  backend from the infra scaffold is running.

## Known follow-ups (not blocking, just next)

- Bundle is ~918 KB minified (one chunk) — consider `React.lazy()` per page
  once the app grows further.
- UI copy is a mix of French (new/edited sections) and English (untouched
  original labels like button text) — a full i18n pass was out of scope here
  but worth doing before shipping to end users.

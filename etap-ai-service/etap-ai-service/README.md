# ETAP AI Service

Real machine learning, not a stub: **scikit-learn** for anomaly detection,
**Prophet** for consumption forecasting. Called by the NestJS backend's
`AiServiceClient` — never exposed to the frontend directly.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # same DATABASE_URL as the backend works fine
uvicorn main:app --reload --port 8000
```

## How the two models actually work

### Anomaly detection (`POST /detect-anomaly`)

Two-tier approach based on how much invoice history exists for the meter:

- **≥ 8 historical points** → `IsolationForest` (scikit-learn), an
  unsupervised model suited to exactly this problem: flagging a new point as
  anomalous relative to a distribution, with no labeled training data
  needed (we don't have any).
- **< 8 points** (the common case early on, before much history has
  accumulated) → a modified z-score using median/MAD instead of mean/stdev,
  which is meaningfully more robust to outliers in a short series. This is
  a real, named statistical method (Iglewicz & Hoaglin), not an
  improvised placeholder.
- **< 2 points** → refuses to judge and says so explicitly, rather than
  guessing from essentially nothing.

Severity (`FAIBLE`/`MOYENNE`/`CRITIQUE`) is derived from percentage
deviation from the historical baseline.

### Forecasting (`POST /predict`)

Pulls real monthly consumption history directly from the shared PostgreSQL
database (this service **reads** from the same tables Prisma writes to via
a raw parameterized SQL query — it never writes).

- **≥ 6 months of history** → `Prophet`, with `interval_width=0.80` for the
  confidence band, and yearly seasonality only enabled once there's 2+
  years of data (otherwise Prophet can hallucinate a seasonal pattern out
  of a single winter).
- **< 6 months** → falls back to linear regression (`numpy.polyfit`) with a
  confidence band that **widens** the further out the forecast goes —
  deliberately honest about growing uncertainty, since a straight-line
  fallback has no real basis for claiming precision multiple months out.
- If Prophet itself throws (e.g. a genuinely degenerate dataset), the linear
  fallback catches it rather than the whole request failing.

**Neither model persists a "trained model" to reuse across requests.**
Both fit fresh on every call, using whatever data exists at that moment.
For this scale of problem (a handful of meters, monthly-granularity data),
that's a legitimate simpler design than maintaining a training/serving
split with a model registry — refitting on a few dozen data points takes
well under a second. If usage grows to where that stops being true (many
thousands of meters, sub-second latency requirements), that's the point to
introduce a real training pipeline with persisted models — not before.

## What I verified, concretely, not just claimed

I don't have a way to spin up your exact production database in this
environment, so I built a disposable local PostgreSQL instance, wrote
DDL matching your Prisma schema's real table/column names exactly
(`factures`, `lignes_consommation`, `compteurs`, quoted camelCase columns),
seeded it with 18 months of synthetic invoice data with a genuine upward
trend plus noise, and ran the actual HTTP API against it with `uvicorn`:

- `GET /health` → `200 {"status": "ok"}`
- `POST /detect-anomaly` with rich history → correctly flagged a 118%
  spike as `CRITIQUE` via `IsolationForest`, correctly passed a normal
  value
- `POST /detect-anomaly` with sparse history (3 points) → correctly used
  the z-score fallback instead
- `POST /predict` with 18 months of data → real Prophet forecast, correctly
  tracking the seeded upward trend, with sensible confidence intervals
- `POST /predict` with 3 months of data (a fresh site with barely any
  invoices yet) → correctly fell back to linear trend instead of forcing
  Prophet on data too sparse to trust
- **Caught a real bug this way**: Prisma's `DATABASE_URL` includes
  `?schema=public`, which `psycopg2` doesn't understand and fails on
  outright. Fixed by sanitizing the connection string
  (`app/database.py::_sanitize_database_url`) so the exact same
  `DATABASE_URL` value from the backend's `.env` works here unmodified —
  now covered by a unit test so it can't silently regress.
- 13 pytest tests pass, covering both anomaly tiers, the linear-trend
  fallback's point count/confidence-band-widening behavior, and the URL
  sanitization.
- Verified `pip install -r requirements.txt` succeeds from a completely
  fresh virtual environment against the exact pinned versions (not just
  "whatever happened to accumulate" during development).

**What I could NOT verify**: the actual `docker build` of the provided
`Dockerfile` — there's no Docker daemon in this sandbox. The Python-level
logic it runs (installing requirements, warming Prophet's Stan backend) is
the same code I tested directly and it worked, but the container build
itself is untested. Build it once locally before deploying anywhere serious.

## Endpoints

```
GET  /health              → { status: "ok" }
POST /detect-anomaly       body: { siteId, typeEnergie, quantite, historique: number[] }
                            → { anomalie, severite?, description?, score? }
POST /predict               body: { siteId?, typeEnergie?, horizonMonths? }
                            → { month, actual, predicted, lower, upper }[]
```

These match `src/ai/ai-service.client.ts` in the NestJS backend exactly —
don't change the shapes on one side without the other.

## Known limitations worth knowing about, not hiding

- **Prophet's first import compiles a native Stan binary** if it isn't
  already built (10–60s). The Dockerfile warms this at image-build time
  specifically to avoid paying that cost on every container restart —
  but again, that specific step is untested since I can't build the image
  here.
- Forecasts are only as good as the invoice history behind them. A
  brand-new site with one or two invoices will get a wide, low-confidence
  linear extrapolation — that's the model being honest about what it
  doesn't know yet, not a bug.
- No authentication on this service's own endpoints — it's designed to sit
  behind the NestJS backend on an internal network, not be exposed
  directly. Don't put this behind a public port without adding some.

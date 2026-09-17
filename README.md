# Exchange Rates

A dashboard for live currency exchange rates, sourced from the
[Coinbase exchange-rates API](https://api.coinbase.com/v2/exchange-rates).

- **Backend** — FastAPI with `httpx2`, an in-memory cache (10-minute TTL per
  currency), and retry logic with exponential backoff for transient upstream
  failures. Unreachable/invalid upstream responses surface as HTTP 502 with
  friendly messages.
- **Frontend** — React 19 + TypeScript + Material-UI, built with Vite. A welcome
  page leads to the rates dashboard: a currency selector (defaulting to the
  visitor's locale currency), a paginated rates table, and observable
  loading/error states with a retry action. All API calls pass through the
  FastAPI backend; the built SPA is served by FastAPI itself.

## Layout

```
app/          FastAPI application (config, rates service, router, app factory)
tests/        Backend tests (pytest)
frontend/     React app (Vite + MUI), including unit and integration tests
PLAN.md       Implementation plan / progress log
SPEC.md       Product specification
```

## Requirements

- [uv](https://docs.astral.sh/uv/) and Python 3.12+
- Node.js 20+ and npm

## Setup

```bash
uv sync                      # backend dependencies
cd frontend && npm install   # frontend dependencies
```

## Run (development)

Backend API on http://127.0.0.1:8000 (interactive docs at `/docs`):

```bash
uv run uvicorn main:app --reload
```

Frontend dev server on http://localhost:5173 (proxies `/exchange-rates`
to the backend):

```bash
cd frontend && npm run dev
```

## Run (production-style, single process)

Build the SPA, then let FastAPI serve both the API and the frontend:

```bash
cd frontend && npm run build
cd .. && uv run uvicorn main:app --port 8000
```

Open http://127.0.0.1:8000 — `/` shows the welcome page, `/rates` the dashboard.

## Test

```bash
uv run pytest -q                       # backend: endpoint + service tests
cd frontend && npm test                # frontend: unit + API integration tests
cd frontend && npm run typecheck       # TypeScript strict check
cd frontend && npm run build           # also type-checks before building
```

## Configuration (optional environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `COINBASE_EXCHANGE_RATES_URL` | Coinbase v2 exchange-rates | Upstream endpoint |
| `CACHE_TTL_SECONDS` | `600` | Cache lifetime (10 minutes) |
| `REQUEST_TIMEOUT_SECONDS` | `5` | Upstream request timeout |
| `MAX_RETRIES` | `3` | Retry attempts after the first failure |
| `RETRY_BACKOFF_SECONDS` | `0.25` | Base delay for exponential backoff |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed origins (comma-separated) |
| `VITE_API_BASE_URL` (frontend) | same origin | Backend base URL for the SPA |

## API

`GET /exchange-rates?currency=USD` — cached rates against the requested base
currency (3-letter code, case-insensitive). Returns
`{"currency", "rates", "fetched_at", "cached"}`. Upstream failures after
retries return `502` with a user-friendly `detail`.

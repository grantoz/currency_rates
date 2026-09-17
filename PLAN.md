# Implementation Plan — Exchange Rates App (FastAPI + React)

Source of truth: `SPEC.md`. This file is the step-by-step build plan and progress log.

## Architecture

```
Browser ──> React SPA (MUI, react-router)
              │  GET /exchange-rates?currency=XXX   (all API calls go through FastAPI)
              ▼
           FastAPI (uvicorn)
              │  httpx2 + retry w/ exponential backoff + 10-min in-memory cache
              ▼
           Coinbase API  https://api.coinbase.com/v2/exchange-rates
```

- Backend: FastAPI + httpx2 (async client), per-currency in-memory cache (TTL 600 s),
  double-checked locking per cache key, retries (3) with exponential backoff
  (0.25 s base) on transport errors and HTTP 429/5xx; fail-fast (no retry) on
  other 4xx and on invalid payloads. Errors surface as HTTP 502 with friendly
  `detail` messages.
- Frontend: Vite + React 19 + TypeScript + MUI v7 + react-router v7.
  Welcome page at `/`, dashboard at `/rates`. Default currency derived from
  `navigator.language` via `Intl.Locale(...).currency`, falling back to USD.
- FastAPI serves the built SPA from `frontend/dist` (SPA fallback to index.html)
  when present; Vite dev server proxies `/exchange-rates` to `127.0.0.1:8000`.

## API contract (backend ⇄ frontend)

`GET /exchange-rates?currency=USD` (param optional, default `USD`, pattern `^[A-Za-z]{3}$`, case-insensitive)

- `200` → `{"currency": "USD", "rates": {"EUR": "0.92", ...}, "fetched_at": "<ISO-8601>", "cached": false}`
- `422` → validation error (invalid currency param)
- `502` → `{"detail": "<friendly message>"}` (upstream unreachable/invalid after retries)

## File layout

```
main.py                    uvicorn entry (re-exports app.main.app)
app/
  __init__.py
  config.py                Settings + from_env()
  rates.py                 ExchangeRateService (fetch/validate/cache/retry) + router
  main.py                  create_app(), CORS, /health, SPA static mount
tests/
  test_main.py             health endpoint test
  test_rates.py            endpoint/service tests (success, cache TTL, retry/backoff, errors)
frontend/
  package.json             vite, vitest, react, MUI, react-router, testing-library
  vite.config.ts           react plugin, /exchange-rates proxy, vitest jsdom config
  index.html
  src/
    main.tsx, App.tsx, theme.ts, vite-env.d.ts
    api/exchangeRates.ts       fetch wrapper + response validation
    constants/currencies.ts    CURRENCY_OPTIONS
    utils/locale.ts            getDefaultCurrency / getCurrencyName
    utils/format.ts            formatRate / formatTimestamp
    hooks/useExchangeRates.ts  loading/success/error + retry
    components/AppHeader, CurrencySelect, RatesTable, ErrorAlert, LoadingIndicator
    pages/WelcomePage, ExchangeRatesPage
    test/setup.ts, test/fixtures.ts
    *.test.ts(x) colocated (unit + API-communication integration tests)
```

## Steps

| # | Step | Owner | Status |
|---|------|-------|--------|
| 1 | Write plan (this file) | lead | done |
| 2 | Backend: config + rates service + FastAPI app, move httpx2 to runtime deps | agent-backend | done |
| 3 | Backend tests: success, cache TTL/per-key, retry+backoff delays, 5xx/429 retry, 502 on exhaustion, invalid payload (no retry), 422 currency, uppercase normalization | agent-backend | done |
| 4 | Frontend scaffold + npm install | agent-frontend → lead | done |
| 5 | Frontend source: api client, locale util, hook, pages, components, theme, routing | lead | done |
| 6 | Frontend tests: component unit + API integration (stubbed fetch) | lead | done |
| 7 | Integration verification: `uv run pytest`, `npm test`, typecheck, build | lead | done |
| 8 | E2E smoke: uvicorn serving API + built SPA, curl checks | lead | done |
| 9 | README update | lead | done |
| 10 | Final PLAN.md status update | lead | done |
| 11 | Majors-only default view + toggle: constants, filterRates util, RatesFilterToggle component | lead | done |
| 12 | Tests: toggle component, filter util, page integration (majors default, all on toggle) | lead | done |
| 13 | Update SPEC.md + AGENTS.md for majors-only requirement | lead | done |
| 14 | Code-prefix search: filterRatesByCode util + CurrencySearch component + RatesTable no-match state | lead | done |
| 15 | Tests: search component, prefix filter util, page integration (A→AED/ARS/AUD, AE→AED, no match) | lead | done |
| 16 | Update SPEC.md + AGENTS.md for the search filter | lead | done |
| 17 | FIAT_CURRENCIES → full ISO 4217 set; CURRENCY_OPTIONS = sorted union of fiat + top cryptos; constants tests + docs | lead | done |

## Verification commands

```bash
uv run pytest -q                      # backend tests
cd frontend && npm test               # frontend unit + integration tests
cd frontend && npm run typecheck      # tsc --noEmit
cd frontend && npm run build          # production build
uv run uvicorn main:app --port 8000   # serve API + built SPA
```

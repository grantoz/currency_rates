# Project Memory — Exchange Rates App (FastAPI + React)

## What this project is

Implementing `SPEC.md`: a FastAPI backend that proxies the Coinbase exchange-rates API
(httpx2 client, 10-minute in-memory cache per currency, retry with exponential backoff,
HTTP 502 with friendly errors) plus a React/MUI frontend (welcome page at `/`, dashboard
at `/rates`, locale-based default currency, dropdown + paginated rates table, loading and
error states). All frontend API calls pass through FastAPI, which also serves the built SPA.

- `PLAN.md` is the implementation plan and progress log — keep its status table updated.
- `README.md` documents run/test commands and env vars.
- API contract (do not change casually): `GET /exchange-rates?currency=XXX` →
  `{"currency", "rates": Record<string,string>, "fetched_at" (ISO), "cached"}`; 422 on bad
  currency param; 502 `{"detail": "<friendly message>"}` on upstream failure.

## State as of 2026-09-17

- Backend: DONE. `app/` package (config.py, rates.py, main.py), root `main.py` re-exports
  the app, `httpx2` is a runtime dep. 17 pytest tests pass (`uv run pytest -q`).
- Frontend: DONE. `frontend/` — Vite 7 + React 19 + TypeScript strict + MUI 7 +
  react-router 7 + Vitest/jsdom. 74 tests pass (`npm test`), `npm run typecheck` and
  `npm run build` pass. Output bundle ~514 kB (MUI; chunk-size warning is cosmetic).
- Majors-only filter: DONE. Dashboard defaults to fiat currencies + top 5 cryptos
  (BTC, ETH, USDT, BNB, XRP); `RatesFilterToggle` (MUI Switch, `frontend/src/components/`)
  flips between majors-only and all Coinbase instruments. Filtering lives in
  `frontend/src/utils/filterRates.ts`; instrument lists in
  `frontend/src/constants/currencies.ts`: FIAT_CURRENCIES is the full active ISO 4217
  fiat set (~156 codes, incl. XAF/XCD/XCG/XOF/XPF; excludes funds/special codes like
  XDR/XAU and retired codes like ZWL/ANG/HRK), TOP_CRYPTO_CURRENCIES is the top 5
  cryptos, and CURRENCY_OPTIONS is the sorted union of both (drives the dropdown and
  the locale-default fallback). When editing these lists, keep codes sorted and update
  `src/constants/currencies.test.ts`.
- Code-prefix search: DONE. `CurrencySearch` component (text input above the table)
  narrows the table to codes starting with the typed letters (case-insensitive);
  composing with the majors toggle happens in `ExchangeRatesPage`
  (`filterRatesByCode(filterRates(...))`). Empty result shows "No match for [input]"
  via the RatesTable `noMatchFor` prop. The RatesTable `key` includes the query so
  pagination resets per keystroke.
- IMPORTANT (environment): this machine's Node has small-icu. Locale→currency resolution
  uses `Intl.Locale(locale).region` + a static region→currency table
  (`frontend/src/utils/locale.ts`); do NOT use `Intl.Locale().currency` (not in the
  ECMA-402 spec, returns undefined here). Tests that assert localized text must compare
  against the same `Intl` formatter to stay locale-safe.
- E2E smoke test: DONE. uvicorn served API + built SPA; verified `/health` 200,
  `/` and `/rates` 200 (SPA index.html fallback), live `/exchange-rates?currency=EUR`
  200 with 644 rates and `cached: true` on second call, 422 on invalid currency.
  All PLAN.md steps complete.
- Subagent note: frontend was delegated twice to background agents and both returned
  empty results with no files; it was implemented directly instead. Backend agent worked
  fine. Background `npm install` via a background process worked fine.

## Conventions

- Backend: Python 3.12 + uv, full type hints, no stray comments, tests in `tests/`
  (httpx2 MockTransport + `app.dependency_overrides[get_rates_service]`).
- Frontend: colocated `*.test.tsx`, shared fixtures in `src/test/fixtures.ts`,
  MUI imports from individual `@mui/material/<X>` modules.

import type { ExchangeRatesResponse } from "../api/exchangeRates";

export const usdRatesFixture: ExchangeRatesResponse = {
  currency: "USD",
  rates: {
    EUR: "0.92",
    GBP: "0.79",
    JPY: "147.5",
    AED: "3.67",
    ARS: "900",
    AUD: "1.52",
    BTC: "65000",
    ETH: "3200",
    "1INCH": "12.9",
    AAVE: "0.0095",
  },
  fetched_at: "2026-09-16T12:00:00+00:00",
  cached: false,
};

export const eurRatesFixture: ExchangeRatesResponse = {
  currency: "EUR",
  rates: { USD: "1.08" },
  fetched_at: "2026-09-16T12:05:00+00:00",
  cached: true,
};

export function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

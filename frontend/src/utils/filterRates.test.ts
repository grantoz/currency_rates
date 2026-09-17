import { describe, expect, it } from "vitest";
import { filterRates, filterRatesByCode } from "./filterRates";

const rates: Record<string, string> = {
  USD: "1",
  EUR: "0.92",
  GBP: "0.79",
  JPY: "147.5",
  BTC: "65000",
  ETH: "3200",
  USDT: "1",
  BNB: "580",
  XRP: "0.5",
  "1INCH": "12.9",
  AAVE: "0.0095",
  "00": "107",
  PEPE: "500000",
};

describe("filterRates", () => {
  it("keeps fiat currencies and the top cryptocurrencies when majors-only is on", () => {
    const filtered = filterRates(rates, true);

    expect(new Set(Object.keys(filtered))).toEqual(
      new Set(["USD", "EUR", "GBP", "JPY", "BTC", "ETH", "USDT", "BNB", "XRP"]),
    );
  });

  it("returns every instrument from the Coinbase API when majors-only is off", () => {
    expect(filterRates(rates, false)).toEqual(rates);
  });
});

describe("filterRatesByCode", () => {
  it("matches codes by their leftmost letters, case-insensitively", () => {
    expect(Object.keys(filterRatesByCode(rates, "A"))).toEqual(["AAVE"]);
    expect(Object.keys(filterRatesByCode(rates, "a"))).toEqual(["AAVE"]);
    expect(Object.keys(filterRatesByCode(rates, "U"))).toEqual(["USD", "USDT"]);
    expect(Object.keys(filterRatesByCode(rates, "us"))).toEqual(["USD", "USDT"]);
  });

  it("narrows further as the query grows", () => {
    expect(Object.keys(filterRatesByCode(rates, "US"))).toEqual(["USD", "USDT"]);
    expect(Object.keys(filterRatesByCode(rates, "USDT"))).toEqual(["USDT"]);
  });

  it("returns every instrument when the query is empty or blank", () => {
    expect(filterRatesByCode(rates, "")).toEqual(rates);
    expect(filterRatesByCode(rates, "   ")).toEqual(rates);
  });

  it("returns nothing when no code starts with the query", () => {
    expect(filterRatesByCode(rates, "ZZ")).toEqual({});
  });
});

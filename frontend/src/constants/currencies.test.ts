import { describe, expect, it } from "vitest";
import { CURRENCY_OPTIONS, FIAT_CURRENCIES, TOP_CRYPTO_CURRENCIES } from "./currencies";

describe("FIAT_CURRENCIES", () => {
  it("lists only unique three-letter uppercase ISO codes", () => {
    for (const code of FIAT_CURRENCIES) {
      expect(code).toMatch(/^[A-Z]{3}$/);
    }
    expect(new Set(FIAT_CURRENCIES).size).toBe(FIAT_CURRENCIES.length);
  });

  it("covers fiat currencies from every region of the world", () => {
    expect(FIAT_CURRENCIES).toEqual(
      expect.arrayContaining([
        "USD", "EUR", "GBP", "JPY", "CNY", "KRW", "CHF", "CAD", "AUD",
        "INR", "BRL", "ZAR", "AED", "SGD", "XOF", "XPF",
      ]),
    );
  });

  it("contains well over a hundred currencies", () => {
    expect(FIAT_CURRENCIES.length).toBeGreaterThanOrEqual(150);
  });

  it("does not include crypto instruments", () => {
    for (const code of TOP_CRYPTO_CURRENCIES) {
      expect(FIAT_CURRENCIES).not.toContain(code);
    }
  });
});

describe("TOP_CRYPTO_CURRENCIES", () => {
  it("lists exactly the five major cryptocurrencies", () => {
    expect([...TOP_CRYPTO_CURRENCIES]).toEqual(["BTC", "ETH", "USDT", "BNB", "XRP"]);
  });
});

describe("CURRENCY_OPTIONS", () => {
  it("is the sorted union of fiat currencies and top cryptocurrencies", () => {
    expect(CURRENCY_OPTIONS).toEqual(
      [...FIAT_CURRENCIES, ...TOP_CRYPTO_CURRENCIES].sort(),
    );
  });

  it("includes both fiat and crypto entries without duplicates", () => {
    expect(CURRENCY_OPTIONS).toContain("USD");
    expect(CURRENCY_OPTIONS).toContain("BTC");
    expect(new Set(CURRENCY_OPTIONS).size).toBe(CURRENCY_OPTIONS.length);
    expect(CURRENCY_OPTIONS).toHaveLength(FIAT_CURRENCIES.length + TOP_CRYPTO_CURRENCIES.length);
  });
});

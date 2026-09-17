import { afterEach, describe, expect, it, vi } from "vitest";
import { currencyFromLocale, getDefaultCurrency } from "./locale";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubLanguage(language: string | undefined) {
  vi.stubGlobal("navigator", { language });
}

describe("currencyFromLocale", () => {
  it.each([
    ["en-US", "USD"],
    ["de-DE", "EUR"],
    ["en-GB", "GBP"],
    ["ja-JP", "JPY"],
  ])("extracts the currency from %s", (locale, expected) => {
    expect(currencyFromLocale(locale)).toBe(expected);
  });

  it("returns undefined for a locale without a region currency", () => {
    expect(currencyFromLocale("en")).toBeUndefined();
  });

  it("returns undefined for invalid locales", () => {
    expect(currencyFromLocale("not_a_locale!")).toBeUndefined();
  });

  it("returns undefined for a missing locale", () => {
    expect(currencyFromLocale(undefined)).toBeUndefined();
  });

  it("maps the region to a currency when the runtime lacks full ICU data", () => {
    expect(currencyFromLocale("zh-Hans-CN")).toBe("CNY");
    expect(currencyFromLocale("fr-FR")).toBe("EUR");
  });
});

describe("getDefaultCurrency", () => {
  it.each([
    ["en-US", "USD"],
    ["de-DE", "EUR"],
    ["en-GB", "GBP"],
    ["ja-JP", "JPY"],
  ])("defaults to the locale currency for %s", (language, expected) => {
    stubLanguage(language);
    expect(getDefaultCurrency()).toBe(expected);
  });

  it("falls back to USD when the locale currency is not available", () => {
    stubLanguage("en-ZZ");
    expect(getDefaultCurrency()).toBe("USD");
  });

  it("falls back to USD when the locale has no currency", () => {
    stubLanguage("en");
    expect(getDefaultCurrency()).toBe("USD");
  });

  it("falls back to USD when navigator is unavailable", () => {
    stubLanguage(undefined);
    expect(getDefaultCurrency()).toBe("USD");
  });

  it("respects a custom availability list", () => {
    stubLanguage("de-DE");
    expect(getDefaultCurrency(["USD", "CHF"])).toBe("USD");
    expect(getDefaultCurrency(["USD", "EUR"])).toBe("EUR");
  });
});

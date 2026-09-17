import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "../constants/currencies";

const REGION_CURRENCIES: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  JP: "JPY",
  KR: "KRW",
  SG: "SGD",
  HK: "HKD",
  NZ: "NZD",
  IN: "INR",
  MX: "MXN",
  BR: "BRL",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  ZA: "ZAR",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  IE: "EUR",
  AT: "EUR",
  BE: "EUR",
  PT: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  CY: "EUR",
  MT: "EUR",
  HR: "EUR",
};

export function currencyFromLocale(locale?: string): string | undefined {
  if (!locale) {
    return undefined;
  }
  let region: string | undefined;
  try {
    region = new Intl.Locale(locale).region?.toUpperCase();
  } catch {
    return undefined;
  }
  return region ? REGION_CURRENCIES[region] : undefined;
}

export function getDefaultCurrency(
  availableCurrencies: readonly string[] = CURRENCY_OPTIONS,
): string {
  const locale = typeof navigator !== "undefined" ? navigator.language : undefined;
  const currency = currencyFromLocale(locale);
  return currency && availableCurrencies.includes(currency) ? currency : DEFAULT_CURRENCY;
}

export function getCurrencyName(currencyCode: string): string {
  try {
    return (
      new Intl.DisplayNames(undefined, { type: "currency" }).of(currencyCode.toUpperCase()) ??
      currencyCode.toUpperCase()
    );
  } catch {
    return currencyCode.toUpperCase();
  }
}

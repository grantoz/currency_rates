import { FIAT_CURRENCIES, TOP_CRYPTO_CURRENCIES } from "../constants/currencies";

const MAJOR_CURRENCIES: ReadonlySet<string> = new Set([
  ...FIAT_CURRENCIES,
  ...TOP_CRYPTO_CURRENCIES,
]);

export function filterRates(
  rates: Record<string, string>,
  majorsOnly: boolean,
): Record<string, string> {
  if (!majorsOnly) {
    return rates;
  }
  return Object.fromEntries(
    Object.entries(rates).filter(([code]) => MAJOR_CURRENCIES.has(code)),
  );
}

export function filterRatesByCode(
  rates: Record<string, string>,
  query: string,
): Record<string, string> {
  const prefix = query.trim().toUpperCase();
  if (!prefix) {
    return rates;
  }
  return Object.fromEntries(
    Object.entries(rates).filter(([code]) => code.toUpperCase().startsWith(prefix)),
  );
}

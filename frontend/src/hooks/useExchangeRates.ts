import { useCallback, useEffect, useState } from "react";
import { fetchExchangeRates, type ExchangeRatesResponse } from "../api/exchangeRates";

export type RatesStatus = "loading" | "success" | "error";

export interface ExchangeRatesState {
  status: RatesStatus;
  data: ExchangeRatesResponse | null;
  error: string | null;
}

const INITIAL_STATE: ExchangeRatesState = { status: "loading", data: null, error: null };

export function useExchangeRates(currency: string) {
  const [state, setState] = useState<ExchangeRatesState>(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState(INITIAL_STATE);
    fetchExchangeRates(currency, controller.signal)
      .then((data) => setState({ status: "success", data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: "error",
          data: null,
          error: error instanceof Error ? error.message : "Something went wrong.",
        });
      });
    return () => controller.abort();
  }, [currency, attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  return { ...state, retry };
}

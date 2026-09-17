const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";

export interface ExchangeRatesResponse {
  currency: string;
  rates: Record<string, string>;
  fetched_at: string;
  cached: boolean;
}

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function isExchangeRatesResponse(value: unknown): value is ExchangeRatesResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { currency, rates, fetched_at } = value as Record<string, unknown>;
  return (
    typeof currency === "string" &&
    typeof fetched_at === "string" &&
    typeof rates === "object" &&
    rates !== null &&
    Object.values(rates).every((rate) => typeof rate === "string")
  );
}

async function extractErrorDetail(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return typeof body?.detail === "string" ? body.detail : null;
  } catch {
    return null;
  }
}

export async function fetchExchangeRates(
  currency: string,
  signal?: AbortSignal,
): Promise<ExchangeRatesResponse> {
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/exchange-rates?currency=${encodeURIComponent(currency)}`,
      { headers: { Accept: "application/json" }, signal },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(
      "Unable to reach the exchange rate service. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    const detail = await extractErrorDetail(response);
    throw new ApiError(
      detail ?? `The exchange rate service responded with status ${response.status}.`,
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("The exchange rate service returned a malformed response.");
  }

  if (!isExchangeRatesResponse(payload)) {
    throw new ApiError("The exchange rate service returned unexpected data.");
  }
  return payload;
}

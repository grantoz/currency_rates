import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, usdRatesFixture } from "../test/fixtures";
import { ApiError, fetchExchangeRates } from "./exchangeRates";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchExchangeRates", () => {
  it("requests the backend endpoint and parses a valid payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(usdRatesFixture));
    vi.stubGlobal("fetch", fetchMock);

    const data = await fetchExchangeRates("USD");

    expect(fetchMock).toHaveBeenCalledWith(
      "/exchange-rates?currency=USD",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(data.currency).toBe("USD");
    expect(data.rates.EUR).toBe("0.92");
    expect(data.cached).toBe(false);
  });

  it("prefixes the configured API base URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.resetModules();
    const { fetchExchangeRates } = await import("./exchangeRates");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(usdRatesFixture));
    vi.stubGlobal("fetch", fetchMock);

    await fetchExchangeRates("EUR");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/exchange-rates?currency=EUR",
      expect.anything(),
    );
  });

  it("uses the server detail message on error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { detail: "The exchange rate provider is temporarily unavailable. Please try again shortly." },
          false,
          502,
        ),
      ),
    );

    await expect(fetchExchangeRates("USD")).rejects.toThrow(/temporarily unavailable/);
  });

  it("falls back to a status-based message when the error body has no detail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));

    const error = await fetchExchangeRates("USD").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toContain("500");
    expect((error as ApiError).status).toBe(500);
  });

  it("raises a friendly error on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(fetchExchangeRates("USD")).rejects.toThrow(
      "Unable to reach the exchange rate service.",
    );
  });

  it("raises an error when the payload shape is unexpected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ foo: "bar" })));

    await expect(fetchExchangeRates("USD")).rejects.toThrow("unexpected data");
  });

  it("raises an error on malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => Promise.reject(new SyntaxError("bad")) }),
    );

    await expect(fetchExchangeRates("USD")).rejects.toThrow("malformed response");
  });

  it("propagates abort errors untouched", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(fetchExchangeRates("USD")).rejects.toBe(abortError);
  });
});

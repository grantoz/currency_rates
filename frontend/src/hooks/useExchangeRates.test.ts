import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usdRatesFixture } from "../test/fixtures";
import { useExchangeRates } from "./useExchangeRates";

const fetchExchangeRatesMock = vi.hoisted(() => vi.fn());

vi.mock("../api/exchangeRates", () => ({
  ApiError: class ApiError extends Error {},
  fetchExchangeRates: fetchExchangeRatesMock,
}));

afterEach(() => {
  fetchExchangeRatesMock.mockReset();
});

describe("useExchangeRates", () => {
  it("starts loading and reports success with the fetched data", async () => {
    fetchExchangeRatesMock.mockResolvedValue(usdRatesFixture);

    const { result } = renderHook(() => useExchangeRates("USD"));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual(usdRatesFixture);
    expect(result.current.error).toBeNull();
    expect(fetchExchangeRatesMock).toHaveBeenCalledWith("USD", expect.anything());
  });

  it("reports the error message when the request fails", async () => {
    fetchExchangeRatesMock.mockRejectedValue(new Error("Unable to reach the service."));

    const { result } = renderHook(() => useExchangeRates("USD"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("Unable to reach the service.");
    expect(result.current.data).toBeNull();
  });

  it("refetches when the currency changes", async () => {
    fetchExchangeRatesMock.mockResolvedValue(usdRatesFixture);

    const { result, rerender } = renderHook(
      ({ currency }) => useExchangeRates(currency),
      { initialProps: { currency: "USD" } },
    );

    await waitFor(() => expect(result.current.status).toBe("success"));
    rerender({ currency: "EUR" });

    await waitFor(() =>
      expect(fetchExchangeRatesMock).toHaveBeenLastCalledWith("EUR", expect.anything()),
    );
  });

  it("retries the request when retry is called", async () => {
    fetchExchangeRatesMock
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(usdRatesFixture);

    const { result } = renderHook(() => useExchangeRates("USD"));

    await waitFor(() => expect(result.current.status).toBe("error"));

    result.current.retry();

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchExchangeRatesMock).toHaveBeenCalledTimes(2);
  });
});

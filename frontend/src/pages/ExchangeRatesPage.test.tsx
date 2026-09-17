import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { eurRatesFixture, jsonResponse, usdRatesFixture } from "../test/fixtures";
import { formatRate } from "../utils/format";
import ExchangeRatesPage from "./ExchangeRatesPage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ExchangeRatesPage", () => {
  it("shows a loading state, then the rates returned by the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(usdRatesFixture));
    vi.stubGlobal("fetch", fetchMock);

    render(<ExchangeRatesPage />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(await screen.findByText("EUR")).toBeInTheDocument();
    expect(screen.getByText(formatRate("0.92"))).toBeInTheDocument();
    expect(screen.getByDisplayValue("USD")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/exchange-rates?currency=USD",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("shows a friendly error with a retry action when the backend fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { detail: "The exchange rate provider is temporarily unavailable. Please try again shortly." },
          false,
          502,
        ),
      )
      .mockResolvedValueOnce(jsonResponse(usdRatesFixture));
    vi.stubGlobal("fetch", fetchMock);

    render(<ExchangeRatesPage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/temporarily unavailable/);

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("EUR")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refetches from the backend when a different currency is selected", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(usdRatesFixture))
      .mockResolvedValueOnce(jsonResponse(eurRatesFixture));
    vi.stubGlobal("fetch", fetchMock);

    render(<ExchangeRatesPage />);
    await screen.findByText("EUR");

    await user.click(screen.getByRole("combobox", { name: /base currency/i }));
    await user.click(screen.getByRole("option", { name: /^EUR\b/ }));

    expect(await screen.findByText(formatRate("1.08"))).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/exchange-rates?currency=EUR",
      expect.anything(),
    );
  });

  it("shows only major currencies by default and all instruments when the filter is toggled off", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(usdRatesFixture)));

    render(<ExchangeRatesPage />);

    expect(await screen.findByText("EUR")).toBeInTheDocument();
    const toggle = screen.getByRole("switch", { name: /majors only/i });
    expect(toggle).toBeChecked();
    expect(screen.queryByText("1INCH")).not.toBeInTheDocument();
    expect(screen.queryByText("AAVE")).not.toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();

    await user.click(toggle);

    expect(screen.getByText("1INCH")).toBeInTheDocument();
    expect(screen.getByText("AAVE")).toBeInTheDocument();
  });

  it("filters the table by code prefix as the user types", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(usdRatesFixture)));

    render(<ExchangeRatesPage />);
    await screen.findByText("EUR");

    const search = screen.getByRole("textbox", { name: /filter currencies/i });
    await user.type(search, "a");

    expect(screen.getByText("AED")).toBeInTheDocument();
    expect(screen.getByText("ARS")).toBeInTheDocument();
    expect(screen.getByText("AUD")).toBeInTheDocument();
    expect(screen.queryByText("EUR")).not.toBeInTheDocument();
    expect(screen.queryByText("AAVE")).not.toBeInTheDocument();

    await user.type(search, "e");

    expect(screen.getByText("AED")).toBeInTheDocument();
    expect(screen.queryByText("ARS")).not.toBeInTheDocument();
    expect(screen.queryByText("AUD")).not.toBeInTheDocument();
  });

  it("shows a no-match message when the code filter matches nothing", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(usdRatesFixture)));

    render(<ExchangeRatesPage />);
    await screen.findByText("EUR");

    await user.type(screen.getByRole("textbox", { name: /filter currencies/i }), "zz");

    expect(screen.getByText("No match for zz")).toBeInTheDocument();
    expect(screen.queryByText("EUR")).not.toBeInTheDocument();
  });
});

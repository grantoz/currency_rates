import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { formatRate } from "../utils/format";
import RatesTable from "./RatesTable";

const rates: Record<string, string> = {
  EUR: "0.92",
  GBP: "0.79",
  JPY: "147.5",
  USD: "1",
  AUD: "1.52",
  CAD: "1.36",
  CHF: "0.88",
  CNY: "7.19",
  KRW: "1345",
  SGD: "1.34",
  INR: "83.5",
  MXN: "17.2",
};

function renderTable() {
  return render(
    <RatesTable baseCurrency="USD" rates={rates} fetchedAt="2026-09-16T12:00:00+00:00" />,
  );
}

describe("RatesTable", () => {
  it("renders rows sorted alphabetically with formatted rates", () => {
    renderTable();

    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(10);
    expect(bodyRows[0]).toHaveTextContent("AUD");
    expect(screen.getByText(formatRate("147.5"))).toBeInTheDocument();
  });

  it("highlights the base currency row", () => {
    render(
      <RatesTable
        baseCurrency="USD"
        rates={{ USD: "1", EUR: "0.92", GBP: "0.79" }}
        fetchedAt="2026-09-16T12:00:00+00:00"
      />,
    );
    expect(screen.getByText("base")).toBeInTheDocument();
  });

  it("shows when the rates were last updated", () => {
    renderTable();
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });

  it("paginates through the rows", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getAllByRole("row")).toHaveLength(11);

    await user.click(screen.getByRole("button", { name: /go to next page/i }));

    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("SGD")).toBeInTheDocument();
  });

  it("reports which query produced no match", () => {
    render(
      <RatesTable
        baseCurrency="USD"
        rates={{}}
        fetchedAt="2026-09-16T12:00:00+00:00"
        noMatchFor="ZZ"
      />,
    );

    expect(screen.getByText("No match for ZZ")).toBeInTheDocument();
  });

  it("keeps the generic empty message when there is no active query", () => {
    render(
      <RatesTable baseCurrency="USD" rates={{}} fetchedAt="2026-09-16T12:00:00+00:00" />,
    );

    expect(screen.getByText("No exchange rates available.")).toBeInTheDocument();
  });
});

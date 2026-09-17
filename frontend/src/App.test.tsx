import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, usdRatesFixture } from "./test/fixtures";
import App from "./App";

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("shows the welcome page on load", () => {
    renderApp("/");

    expect(screen.getByRole("heading", { name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view exchange rates/i })).toBeInTheDocument();
  });

  it("shows the exchange rates dashboard when navigating to /rates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(usdRatesFixture)));

    renderApp("/rates");

    expect(
      screen.getByRole("heading", { name: /exchange rates dashboard/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText("EUR")).toBeInTheDocument();
  });
});

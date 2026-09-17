import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CURRENCY_OPTIONS } from "../constants/currencies";
import CurrencySelect from "./CurrencySelect";

describe("CurrencySelect", () => {
  it("renders all supported currencies", async () => {
    const user = userEvent.setup();
    render(<CurrencySelect value="USD" onChange={() => {}} />);

    await user.click(screen.getByRole("combobox"));

    for (const code of CURRENCY_OPTIONS) {
      expect(
        screen.getByRole("option", { name: new RegExp(`^${code}\\b`) }),
      ).toBeInTheDocument();
    }
  });

  it("reports the selected currency", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencySelect value="USD" onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /^EUR\b/ }));

    expect(onChange).toHaveBeenCalledWith("EUR");
  });

  it("labels the control for accessibility", () => {
    render(<CurrencySelect value="USD" onChange={() => {}} label="Base currency" />);
    expect(screen.getByLabelText("Base currency")).toBeInTheDocument();
  });
});

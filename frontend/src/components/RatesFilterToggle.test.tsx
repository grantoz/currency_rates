import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RatesFilterToggle from "./RatesFilterToggle";

describe("RatesFilterToggle", () => {
  it("is checked by default when majors-only is enabled", () => {
    render(<RatesFilterToggle majorsOnly onToggle={() => {}} />);

    expect(screen.getByRole("switch", { name: /majors only/i })).toBeChecked();
  });

  it("is unchecked when majors-only is disabled", () => {
    render(<RatesFilterToggle majorsOnly={false} onToggle={() => {}} />);

    expect(screen.getByRole("switch", { name: /majors only/i })).not.toBeChecked();
  });

  it("reports the new state when toggled", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<RatesFilterToggle majorsOnly onToggle={onToggle} />);

    await user.click(screen.getByRole("switch", { name: /majors only/i }));

    expect(onToggle).toHaveBeenCalledWith(false);
  });
});

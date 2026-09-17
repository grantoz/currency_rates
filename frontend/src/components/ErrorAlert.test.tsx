import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorAlert from "./ErrorAlert";

describe("ErrorAlert", () => {
  it("shows the message inside an observable alert", () => {
    render(<ErrorAlert message="The exchange rate provider is temporarily unavailable." />);
    expect(screen.getByRole("alert")).toHaveTextContent(/temporarily unavailable/);
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorAlert message="boom" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

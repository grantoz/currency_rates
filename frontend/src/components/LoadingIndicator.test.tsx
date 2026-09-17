import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoadingIndicator from "./LoadingIndicator";

describe("LoadingIndicator", () => {
  it("shows an observable progress indicator with a label", () => {
    render(<LoadingIndicator label="Loading exchange rates for USD…" />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText(/Loading exchange rates for USD/)).toBeInTheDocument();
  });
});

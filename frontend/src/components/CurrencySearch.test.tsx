import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import CurrencySearch from "./CurrencySearch";

function SearchHarness() {
  const [query, setQuery] = useState("");
  return <CurrencySearch query={query} onChange={setQuery} />;
}

describe("CurrencySearch", () => {
  it("binds the typed query to onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencySearch query="" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: /filter currencies/i });
    await user.type(input, "ae");

    expect(onChange).toHaveBeenNthCalledWith(1, "a");
    expect(onChange).toHaveBeenNthCalledWith(2, "e");
  });

  it("accumulates keystrokes into the query value", async () => {
    const user = userEvent.setup();
    render(<SearchHarness />);

    const input = screen.getByRole("textbox", { name: /filter currencies/i });
    await user.type(input, "ae");

    expect(input).toHaveValue("ae");
  });

  it("renders the current query value", () => {
    render(<CurrencySearch query="AE" onChange={() => {}} />);

    expect(screen.getByRole("textbox", { name: /filter currencies/i })).toHaveValue("AE");
  });
});

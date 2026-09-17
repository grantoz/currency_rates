import { describe, expect, it } from "vitest";
import { formatRate, formatTimestamp } from "./format";

describe("formatRate", () => {
  it("formats numeric rates through the runtime number formatter", () => {
    expect(formatRate("147.5")).toBe(
      new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(147.5),
    );
  });

  it("caps precision at six significant digits", () => {
    const numeric = Number(formatRate("0.923746852"));
    expect(numeric).toBeCloseTo(0.923747, 5);
  });

  it("falls back to the raw value when it is not numeric", () => {
    expect(formatRate("N/A")).toBe("N/A");
  });
});

describe("formatTimestamp", () => {
  it("formats ISO timestamps through the runtime date formatter", () => {
    const expected = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date("2026-09-16T12:00:00+00:00"));
    expect(formatTimestamp("2026-09-16T12:00:00+00:00")).toBe(expected);
  });

  it("falls back to the raw value when it is not a valid date", () => {
    expect(formatTimestamp("not-a-date")).toBe("not-a-date");
  });
});

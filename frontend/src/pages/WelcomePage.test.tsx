import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import WelcomePage from "./WelcomePage";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderWelcomePage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/rates" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("WelcomePage", () => {
  it("greets the user with a call to action", () => {
    renderWelcomePage();

    expect(screen.getByRole("heading", { name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view exchange rates/i })).toBeInTheDocument();
  });

  it("navigates to the exchange rates dashboard when the button is clicked", async () => {
    const user = userEvent.setup();
    renderWelcomePage();

    await user.click(screen.getByRole("button", { name: /view exchange rates/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/rates");
  });
});

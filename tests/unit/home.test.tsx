import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home Page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The Morningstar Solution");
  });

  it("renders the description", () => {
    render(<Home />);
    expect(screen.getByText(/Engineering Reality Platform/i)).toBeInTheDocument();
  });

  it("renders Get Started button", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  it("renders Documentation button", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /documentation/i })).toBeInTheDocument();
  });
});

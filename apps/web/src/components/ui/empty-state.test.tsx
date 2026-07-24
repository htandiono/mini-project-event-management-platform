import { render, screen } from "@testing-library/react";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("announces the supplied empty result message", () => {
    render(<EmptyState title="No events found" description="Try another city." />);

    expect(screen.getByRole("heading", { name: "No events found" })).toBeInTheDocument();
    expect(screen.getByText("Try another city.")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PresentationDeck } from "./presentation-deck";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PresentationDeck", () => {
  it("navigates with the keyboard and identifies each feature owner", () => {
    render(<PresentationDeck />);

    expect(screen.getByRole("heading", { name: "Eventure" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(
      screen.getByRole("heading", { name: /one platform, two complete journeys/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 3: Ownership" }));

    expect(screen.getByText("Feature 1 · htandiono")).toBeInTheDocument();
    expect(screen.getByText("Feature 2 · awanstywn")).toBeInTheDocument();
  });

  it("summarizes successful production API checks", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: "API is healthy",
            data: { status: "ok", timestamp: "2026-07-30T04:00:00.000Z" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              data: [
                { city: "Jakarta", name: "Jakarta Creative Conference" },
                { city: "Bandung", name: "Bandung Design Week" },
              ],
              total: 39,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    render(<PresentationDeck />);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 12: Live proof" }));
    fireEvent.click(screen.getByRole("button", { name: "Run live checks" }));

    expect(await screen.findByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("39")).toBeInTheDocument();
    expect(screen.getByText(/Bandung · Jakarta/)).toBeInTheDocument();
    expect(screen.getByText(/Jakarta Creative Conference/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/health");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/events?limit=24");
  });
});

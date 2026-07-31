import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PresentationDeck } from "./presentation-deck";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PresentationDeck", () => {
  it("navigates through the examiner flow and preserves individual ownership", () => {
    render(<PresentationDeck />);

    expect(screen.getByRole("heading", { name: "Eventure" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(
      screen.getByRole("heading", { name: /one connected event system/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 3: Responsibility" }));

    expect(screen.getByText("Feature 1 / htandiono")).toBeInTheDocument();
    expect(screen.getByText("Feature 2 / awanstywn")).toBeInTheDocument();
    expect(screen.getByText("reviewed PRs")).toBeInTheDocument();
    expect(screen.getByText("Integration + CI")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 6: Database" }));

    expect(
      screen.getByRole("img", {
        name: /simplified eventure entity relationship diagram/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("TransactionItem")).toBeInTheDocument();
    expect(screen.getByText("PaymentProof")).toBeInTheDocument();
  });

  it("lists all API families and switches to organizer routes", () => {
    render(<PresentationDeck />);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 10: API reference" }));

    expect(screen.getByRole("heading", { name: /45 routes are grouped/i })).toBeInTheDocument();
    expect(screen.getByText("/events/:slug/reviews")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Organizer flow/ }));

    expect(screen.getByText("/organizer/transactions/:id/accept")).toBeInTheDocument();
    expect(screen.getByText("/dashboard/events/:id/attendees")).toBeInTheDocument();
  });

  it("breaks both feature owners' work into source-backed sections", () => {
    render(<PresentationDeck />);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 7: Feature 1" }));

    expect(screen.getByRole("heading", { name: /four connected sections/i })).toBeInTheDocument();
    expect(screen.getByText(/voucher → coupon → points order/i)).toBeInTheDocument();
    expect(screen.getByText(/attendance is recorded separately/i)).toBeInTheDocument();
    expect(screen.getByText("checkout.service.ts")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 8: Feature 2" }));

    expect(screen.getByRole("heading", { name: /account and organizer/i })).toBeInTheDocument();
    expect(
      screen.getByText(/inviter 10,000 points and the new user a 10% coupon/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Supabase Storage, with Cloudinary as fallback/i)).toBeInTheDocument();
    expect(screen.getByText(/three summary cards and three Recharts series/i)).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Go to slide 14: Defense" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to slide 13: Deployment and demo" }),
    ).toBeInTheDocument();
  });

  it("summarizes successful production API checks", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: "Production API is healthy",
          data: {
            cities: ["Bandung", "Jakarta"],
            eventCount: 39,
            firstEvent: "Jakarta Creative Conference",
            health: "ok",
            latency: 42,
            timestamp: "2026-07-30T04:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<PresentationDeck />);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 11: API example" }));
    fireEvent.click(screen.getByRole("button", { name: "Run live checks" }));

    expect(await screen.findByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("39")).toBeInTheDocument();
    expect(screen.getByText(/Bandung · Jakarta/)).toBeInTheDocument();
    expect(screen.getByText(/Jakarta Creative Conference/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/presentation-check", { cache: "no-store" });
  });
});

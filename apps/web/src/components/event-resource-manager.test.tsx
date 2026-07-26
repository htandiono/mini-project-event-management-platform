import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getEventTickets, getEventVouchers, getOrganizerEvent } from "@/lib/api-client";

import { EventResourceManager } from "./event-resource-manager";

vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...original,
    getEventTickets: vi.fn(),
    getEventVouchers: vi.fn(),
    getOrganizerEvent: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrganizerEvent).mockResolvedValue({
    id: "event-1",
    slug: "community-day",
    name: "Community Day",
    categoryId: "category-1",
    categoryName: "Community",
    description: "A community gathering in the city.",
    venue: "Town Hall",
    address: "Jalan Merdeka 1",
    city: "Bandung",
    province: "West Java",
    startsAt: "2026-10-01T03:00:00.000Z",
    endsAt: "2026-10-01T06:00:00.000Z",
    capacity: 50,
    availableSeats: 50,
    isFree: false,
    status: "DRAFT",
    ticketTypeCount: 1,
    thumbnailUrl: null,
  });
  vi.mocked(getEventTickets).mockResolvedValue([
    {
      id: "ticket-1",
      name: "General Admission",
      description: null,
      price: 100_000,
      capacity: 50,
      availableSeats: 50,
      salesStartAt: null,
      salesEndAt: null,
    },
  ]);
  vi.mocked(getEventVouchers).mockResolvedValue([
    {
      id: "voucher-1",
      code: "EARLY10",
      name: "Early bird",
      discountPercent: 10,
      discountAmount: null,
      usageLimit: 20,
      usedCount: 3,
      startsAt: "2026-08-01T00:00:00.000Z",
      endsAt: "2026-09-01T00:00:00.000Z",
    },
  ]);
});

describe("EventResourceManager", () => {
  it("shows configured ticket inventory", async () => {
    render(<EventResourceManager eventId="event-1" />);
    expect(await screen.findByRole("heading", { name: "General Admission" })).toBeInTheDocument();
    expect(screen.getByText("50 of 50 available")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "EARLY10" })).toBeInTheDocument();
  });
});

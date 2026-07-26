import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCategories, getOrganizerEvents } from "@/lib/api-client";

import { OrganizerEventManager } from "./organizer-event-manager";

vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...original, getCategories: vi.fn(), getOrganizerEvents: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCategories).mockResolvedValue([{ id: "category-1", name: "Music", slug: "music" }]);
  vi.mocked(getOrganizerEvents).mockResolvedValue([
    {
      id: "event-1",
      slug: "community-day",
      name: "Community Day",
      categoryName: "Music",
      city: "Bandung",
      startsAt: "2026-10-01T03:00:00.000Z",
      endsAt: "2026-10-01T06:00:00.000Z",
      capacity: 50,
      availableSeats: 40,
      isFree: false,
      status: "DRAFT",
      ticketTypeCount: 1,
    },
  ]);
});

describe("OrganizerEventManager", () => {
  it("loads the organizer's event inventory", async () => {
    render(<OrganizerEventManager />);

    expect(await screen.findByRole("heading", { name: "Community Day" })).toBeInTheDocument();
    expect(screen.getByText(/40 of 50 seats available/)).toBeInTheDocument();
  });
});

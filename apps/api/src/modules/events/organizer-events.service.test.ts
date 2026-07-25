import type { EventInput } from "@eventure/shared";
import type { PrismaClient } from "@eventure/database";
import { describe, expect, it, vi } from "vitest";

import { updateOrganizerEvent } from "./organizer-events.service.js";

const input: EventInput = {
  categoryId: "category-1",
  name: "Community Day",
  description: "A useful gathering for the local community.",
  venue: "Town Hall",
  address: "Jalan Merdeka 1",
  city: "Bandung",
  province: "West Java",
  startsAt: "2026-10-01T03:00:00.000Z",
  endsAt: "2026-10-01T06:00:00.000Z",
  capacity: 120,
  isFree: false,
  status: "PUBLISHED",
};

describe("updateOrganizerEvent", () => {
  it("preserves booked seats when capacity changes", async () => {
    const update = vi.fn((_args: { data: { availableSeats: number } }) =>
      Promise.resolve({
        id: "event-1",
        slug: "community-day",
        name: input.name,
        city: input.city,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        capacity: 120,
        availableSeats: 100,
        isFree: false,
        status: "PUBLISHED" as const,
        category: { name: "Community" },
        _count: { ticketTypes: 1 },
      }),
    );
    const database = {
      event: {
        findFirst: vi.fn().mockResolvedValue({
          capacity: 100,
          availableSeats: 80,
          publishedAt: new Date("2026-01-01T00:00:00.000Z"),
          _count: { ticketTypes: 1 },
        }),
        update,
      },
      category: { findFirst: vi.fn().mockResolvedValue({ id: input.categoryId }) },
    } as unknown as PrismaClient;

    const result = await updateOrganizerEvent(database, "organizer-1", "event-1", input);

    expect(update.mock.calls[0]?.[0].data.availableSeats).toBe(100);
    expect(result.availableSeats).toBe(100);
  });

  it("rejects capacity below existing bookings", async () => {
    const database = {
      event: {
        findFirst: vi.fn().mockResolvedValue({
          capacity: 100,
          availableSeats: 80,
          publishedAt: null,
          _count: { ticketTypes: 1 },
        }),
      },
    } as unknown as PrismaClient;

    await expect(
      updateOrganizerEvent(database, "organizer-1", "event-1", { ...input, capacity: 19 }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects publication until a ticket type exists", async () => {
    const database = {
      event: {
        findFirst: vi.fn().mockResolvedValue({
          capacity: 100,
          availableSeats: 100,
          publishedAt: null,
          _count: { ticketTypes: 0 },
        }),
      },
    } as unknown as PrismaClient;

    await expect(
      updateOrganizerEvent(database, "organizer-1", "event-1", input),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

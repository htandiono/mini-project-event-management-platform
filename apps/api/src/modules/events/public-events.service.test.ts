import type { PrismaClient } from "@eventure/database";
import { describe, expect, it, vi } from "vitest";

import { eventListQuerySchema } from "./event.schemas.js";
import { listPublishedEvents } from "./public-events.service.js";

const baseRecord = {
  id: "event-1",
  slug: "community-day",
  name: "Community Day",
  city: "Bandung",
  venue: "Town Hall",
  startsAt: new Date("2026-10-01T03:00:00.000Z"),
  thumbnailUrl: null,
  isFree: false,
  category: { name: "Community" },
  organizer: { name: "Eventure" },
};

describe("event list query", () => {
  it("applies safe pagination defaults", () => {
    expect(eventListQuerySchema.parse({})).toEqual({
      sort: "startsAt",
      order: "asc",
      page: 1,
      limit: 9,
    });
  });

  it("rejects an excessive page size", () => {
    expect(() => eventListQuerySchema.parse({ limit: 25 })).toThrow();
  });
});

describe("listPublishedEvents", () => {
  it("sorts by minimum ticket price before paginating", async () => {
    const database = {
      event: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([
          { ...baseRecord, ticketTypes: [{ price: 150_000 }] },
          {
            ...baseRecord,
            id: "event-2",
            slug: "free-day",
            name: "Free Day",
            isFree: true,
            ticketTypes: [{ price: 0 }],
          },
        ]),
      },
    } as unknown as PrismaClient;

    const result = await listPublishedEvents(
      database,
      eventListQuerySchema.parse({ sort: "price" }),
      new Date("2026-01-01T00:00:00.000Z"),
    );

    expect(result.data.map((event) => event.name)).toEqual(["Free Day", "Community Day"]);
    expect(result.totalPages).toBe(1);
  });
});

import type { PrismaClient } from "@eventure/database";
import type { TicketTypeInput } from "@eventure/shared";
import { describe, expect, it, vi } from "vitest";

import { createEventTicket, updateEventTicket } from "./event-tickets.service.js";

const input: TicketTypeInput = {
  name: "General Admission",
  description: null,
  price: 100_000,
  capacity: 60,
  salesStartAt: null,
  salesEndAt: null,
};

describe("event ticket management", () => {
  it("rejects allocations beyond event capacity", async () => {
    const database = {
      event: {
        findFirst: vi.fn().mockResolvedValue({ id: "event-1", capacity: 100, isFree: false }),
      },
      ticketType: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { capacity: 50 } }),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaClient;

    await expect(
      createEventTicket(database, "organizer-1", "event-1", input),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("preserves sold quantity when a ticket allocation grows", async () => {
    const update = vi.fn((_args: { data: { availableSeats: number } }) =>
      Promise.resolve({
        id: "ticket-1",
        ...input,
        capacity: 70,
        availableSeats: 50,
        salesStartAt: null,
        salesEndAt: null,
      }),
    );
    const database = {
      event: {
        findFirst: vi.fn().mockResolvedValue({ id: "event-1", capacity: 100, isFree: false }),
      },
      ticketType: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ capacity: 60, availableSeats: 40 })
          .mockResolvedValueOnce(null),
        aggregate: vi.fn().mockResolvedValue({ _sum: { capacity: 20 } }),
        update,
      },
    } as unknown as PrismaClient;

    const result = await updateEventTicket(database, "organizer-1", "event-1", "ticket-1", {
      ...input,
      capacity: 70,
    });

    expect(update.mock.calls[0]?.[0].data.availableSeats).toBe(50);
    expect(result.availableSeats).toBe(50);
  });
});

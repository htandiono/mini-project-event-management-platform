import { describe, expect, it } from "vitest";

import { organizerTransactionQuerySchema } from "./transactions.js";

describe("organizerTransactionQuerySchema", () => {
  it("accepts supported transaction filters", () => {
    expect(
      organizerTransactionQuerySchema.parse({
        status: "WAITING_FOR_CONFIRMATION",
        eventId: "event-1",
      }),
    ).toEqual({ status: "WAITING_FOR_CONFIRMATION", eventId: "event-1" });
  });

  it("rejects unknown statuses before they reach Prisma", () => {
    expect(() => organizerTransactionQuerySchema.parse({ status: "PENDING" })).toThrow();
  });
});

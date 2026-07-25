import type { PrismaClient } from "@eventure/database";
import { describe, expect, it, vi } from "vitest";

import { createTransactionReview } from "./reviews.service.js";
import { reviewInputSchema } from "./transaction.schemas.js";

describe("review validation", () => {
  it("rejects ratings outside the one-to-five range", () => {
    expect(() => reviewInputSchema.parse({ rating: 6, comment: "A useful event" })).toThrow();
  });
});

describe("createTransactionReview", () => {
  it("rejects a review before the attended event has ended", async () => {
    const database = {
      transaction: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaClient;

    await expect(
      createTransactionReview(
        database,
        "customer-1",
        "transaction-1",
        { rating: 5, comment: "A useful event" },
        new Date("2026-08-01T00:00:00.000Z"),
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

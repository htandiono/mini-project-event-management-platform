import type { PrismaClient } from "@eventure/database";
import { describe, expect, it, vi } from "vitest";

import { voucherInputSchema } from "./event.schemas.js";
import { updateEventVoucher } from "./event-vouchers.service.js";

describe("voucher validation", () => {
  it("requires exactly one discount type", () => {
    expect(() =>
      voucherInputSchema.parse({
        code: "SAVE10",
        name: "Save ten",
        discountPercent: 10,
        discountAmount: 10_000,
        usageLimit: 20,
        startsAt: "2026-08-01T00:00:00.000Z",
        endsAt: "2026-09-01T00:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("updateEventVoucher", () => {
  it("rejects a usage limit below existing redemptions", async () => {
    const database = {
      event: { findFirst: vi.fn().mockResolvedValue({ isFree: false }) },
      voucher: { findFirst: vi.fn().mockResolvedValue({ usedCount: 5 }) },
    } as unknown as PrismaClient;
    const input = voucherInputSchema.parse({
      code: "SAVE10",
      name: "Save ten",
      discountPercent: 10,
      usageLimit: 4,
      startsAt: "2026-08-01T00:00:00.000Z",
      endsAt: "2026-09-01T00:00:00.000Z",
    });

    await expect(
      updateEventVoucher(database, "organizer-1", "event-1", "voucher-1", input),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

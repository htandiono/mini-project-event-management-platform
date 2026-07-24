import { describe, expect, it } from "vitest";

import { calculateCheckoutTotals } from "./checkout.service.js";
import { checkoutInputSchema } from "./transaction.schemas.js";

describe("checkout input", () => {
  it("normalizes voucher codes and defaults points", () => {
    const result = checkoutInputSchema.parse({
      eventId: "event-1",
      items: [{ ticketTypeId: "ticket-1", quantity: 2 }],
      voucherCode: " early10 ",
    });

    expect(result.voucherCode).toBe("EARLY10");
    expect(result.pointsToUse).toBe(0);
  });
});

describe("calculateCheckoutTotals", () => {
  it("applies voucher, coupon, then points without producing a negative total", () => {
    expect(calculateCheckoutTotals(200_000, 500_000, { percent: 10 }, { percent: 10 })).toEqual({
      subtotal: 200_000,
      voucherDiscount: 20_000,
      couponDiscount: 18_000,
      pointsUsed: 162_000,
      total: 0,
    });
  });

  it("caps a fixed voucher at the subtotal", () => {
    expect(calculateCheckoutTotals(50_000, 0, { amount: 75_000 })).toMatchObject({
      voucherDiscount: 50_000,
      total: 0,
    });
  });
});

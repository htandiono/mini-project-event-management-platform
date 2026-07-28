import { TransactionStatus, type PrismaClient } from "@eventure/database";
import { describe, expect, it, vi } from "vitest";

import { cancelCustomerTransaction } from "./transaction-lifecycle.service.js";

describe("cancelCustomerTransaction", () => {
  it("restores seats, voucher, coupon, and points atomically", async () => {
    const client = {
      transaction: {
        findFirst: vi.fn().mockResolvedValue({
          id: "transaction-1",
          customerId: "customer-1",
          eventId: "event-1",
          voucherId: "voucher-1",
          userCouponId: "coupon-1",
          status: TransactionStatus.WAITING_FOR_PAYMENT,
          pointsUsed: 10_000,
          invoiceNumber: "EVT-1",
          items: [{ ticketTypeId: "ticket-1", quantity: 2 }],
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      event: { update: vi.fn().mockResolvedValue({}) },
      ticketType: { update: vi.fn().mockResolvedValue({}) },
      voucher: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      userCoupon: { update: vi.fn().mockResolvedValue({}) },
      pointLedger: { create: vi.fn().mockResolvedValue({}) },
    };
    const database = {
      $transaction: vi.fn((callback: (transactionClient: typeof client) => Promise<boolean>) =>
        callback(client),
      ),
    } as unknown as PrismaClient;

    await cancelCustomerTransaction(database, "customer-1", "transaction-1");

    expect(client.event.update).toHaveBeenCalledOnce();
    expect(client.ticketType.update).toHaveBeenCalledOnce();
    expect(client.voucher.updateMany).toHaveBeenCalledOnce();
    expect(client.userCoupon.update).toHaveBeenCalledOnce();
    expect(client.pointLedger.create).toHaveBeenCalledOnce();
  });
});

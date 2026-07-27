import { TransactionStatus, type PrismaClient } from "@eventure/database";
import { describe, expect, it, vi } from "vitest";

import { submitPaymentProof } from "./payment-proof.service.js";

function setupDatabase(transitionCount = 1) {
  const client = {
    transaction: { updateMany: vi.fn().mockResolvedValue({ count: transitionCount }) },
    paymentProof: { create: vi.fn().mockResolvedValue({}) },
  };
  const database = {
    transaction: {
      findFirst: vi.fn().mockResolvedValue({
        id: "transaction-1",
        status: TransactionStatus.WAITING_FOR_PAYMENT,
        paymentDeadline: new Date("2026-07-28T12:00:00.000Z"),
      }),
    },
    $transaction: vi.fn((callback: (transactionClient: typeof client) => Promise<void>) =>
      callback(client),
    ),
  } as unknown as PrismaClient;

  return { database, client };
}

describe("submitPaymentProof", () => {
  const file = {
    buffer: Buffer.from("payment-proof"),
    mimetype: "image/jpeg",
    size: 13,
  };
  const now = new Date("2026-07-28T10:00:00.000Z");

  it("uploads proof and advances the transaction atomically", async () => {
    const { database, client } = setupDatabase();
    const storage = {
      upload: vi.fn().mockResolvedValue({ url: "https://cloud.example/proof.jpg", publicId: "p1" }),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      submitPaymentProof(database, "customer-1", "transaction-1", file, now, storage),
    ).resolves.toMatchObject({
      transactionId: "transaction-1",
      status: "WAITING_FOR_CONFIRMATION",
      paymentUploadedAt: now.toISOString(),
    });

    expect(client.transaction.updateMany).toHaveBeenCalledOnce();
    expect(client.paymentProof.create).toHaveBeenCalledOnce();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it("removes the cloud image when a concurrent status change aborts the database write", async () => {
    const { database, client } = setupDatabase(0);
    const storage = {
      upload: vi.fn().mockResolvedValue({ url: "https://cloud.example/proof.jpg", publicId: "p1" }),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      submitPaymentProof(database, "customer-1", "transaction-1", file, now, storage),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(client.paymentProof.create).not.toHaveBeenCalled();
    expect(storage.remove).toHaveBeenCalledWith("p1");
  });
});

import {
  PointEntryType,
  TransactionStatus,
  UserCouponStatus,
  type Prisma,
  type PrismaClient,
} from "@eventure/database";
import type { TransactionSummary } from "@eventure/shared";

import { AppError } from "../../lib/app-error.js";
import { mapTransaction, transactionSummarySelect } from "./transaction.mapper.js";

const restorationSelect = {
  id: true,
  customerId: true,
  eventId: true,
  voucherId: true,
  userCouponId: true,
  status: true,
  pointsUsed: true,
  invoiceNumber: true,
  items: { select: { ticketTypeId: true, quantity: true } },
} satisfies Prisma.TransactionSelect;

type RestorableTransaction = Prisma.TransactionGetPayload<{ select: typeof restorationSelect }>;

async function restoreReservation(
  client: Prisma.TransactionClient,
  transaction: RestorableTransaction,
  nextStatus: "EXPIRED" | "CANCELED",
  reason: string,
  now: Date,
): Promise<boolean> {
  const transition = await client.transaction.updateMany({
    where: { id: transaction.id, status: transaction.status },
    data: {
      status: nextStatus,
      canceledAt: now,
      cancellationReason: reason,
    },
  });

  if (transition.count !== 1) {
    return false;
  }

  const quantity = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
  await client.event.update({
    where: { id: transaction.eventId },
    data: { availableSeats: { increment: quantity } },
  });

  for (const item of transaction.items) {
    await client.ticketType.update({
      where: { id: item.ticketTypeId },
      data: { availableSeats: { increment: item.quantity } },
    });
  }

  if (transaction.voucherId) {
    await client.voucher.updateMany({
      where: { id: transaction.voucherId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }

  if (transaction.userCouponId) {
    await client.userCoupon.update({
      where: { id: transaction.userCouponId },
      data: { status: UserCouponStatus.RESTORED, redeemedAt: null },
    });
  }

  if (transaction.pointsUsed > 0) {
    await client.pointLedger.create({
      data: {
        userId: transaction.customerId,
        transactionId: transaction.id,
        type: PointEntryType.RESTORE,
        amount: transaction.pointsUsed,
        description: `Points restored from ${transaction.invoiceNumber}`,
      },
    });
  }

  return true;
}

async function expireTransaction(
  database: PrismaClient,
  transactionId: string,
  expectedStatus: "WAITING_FOR_PAYMENT" | "WAITING_FOR_CONFIRMATION",
  nextStatus: "EXPIRED" | "CANCELED",
  reason: string,
  now: Date,
): Promise<boolean> {
  return database.$transaction(async (client) => {
    const transaction = await client.transaction.findUnique({
      where: { id: transactionId },
      select: restorationSelect,
    });

    if (!transaction || transaction.status !== expectedStatus) {
      return false;
    }

    return restoreReservation(client, transaction, nextStatus, reason, now);
  });
}

export async function expireOverdueTransactions(
  database: PrismaClient,
  now = new Date(),
): Promise<number> {
  const overdue = await database.transaction.findMany({
    where: {
      OR: [
        { status: TransactionStatus.WAITING_FOR_PAYMENT, paymentDeadline: { lte: now } },
        {
          status: TransactionStatus.WAITING_FOR_CONFIRMATION,
          organizerDeadline: { not: null, lte: now },
        },
      ],
    },
    select: { id: true, status: true },
  });
  let expiredCount = 0;

  for (const transaction of overdue) {
    const paymentExpired = transaction.status === TransactionStatus.WAITING_FOR_PAYMENT;
    const expectedStatus = paymentExpired
      ? TransactionStatus.WAITING_FOR_PAYMENT
      : TransactionStatus.WAITING_FOR_CONFIRMATION;
    const restored = await expireTransaction(
      database,
      transaction.id,
      expectedStatus,
      paymentExpired ? TransactionStatus.EXPIRED : TransactionStatus.CANCELED,
      paymentExpired ? "Payment deadline expired" : "Organizer confirmation deadline expired",
      now,
    );
    expiredCount += Number(restored);
  }

  return expiredCount;
}

export async function listCustomerTransactions(
  database: PrismaClient,
  customerId: string,
  now = new Date(),
): Promise<TransactionSummary[]> {
  await expireOverdueTransactions(database, now);
  const transactions = await database.transaction.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: transactionSummarySelect,
  });

  return transactions.map(mapTransaction);
}

export async function getCustomerTransaction(
  database: PrismaClient,
  customerId: string,
  transactionId: string,
  now = new Date(),
): Promise<TransactionSummary> {
  await expireOverdueTransactions(database, now);
  const transaction = await database.transaction.findFirst({
    where: { id: transactionId, customerId },
    select: transactionSummarySelect,
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  return mapTransaction(transaction);
}

export async function cancelCustomerTransaction(
  database: PrismaClient,
  customerId: string,
  transactionId: string,
  now = new Date(),
): Promise<void> {
  const canceled = await database.$transaction(async (client) => {
    const transaction = await client.transaction.findFirst({
      where: {
        id: transactionId,
        customerId,
        status: TransactionStatus.WAITING_FOR_PAYMENT,
      },
      select: restorationSelect,
    });

    if (!transaction) {
      throw new AppError("Only unpaid transactions can be canceled", 409);
    }

    return restoreReservation(
      client,
      transaction,
      TransactionStatus.CANCELED,
      "Canceled by customer",
      now,
    );
  });

  if (!canceled) {
    throw new AppError("Transaction status changed; refresh and try again", 409);
  }
}

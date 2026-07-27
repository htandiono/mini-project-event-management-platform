import { prisma, type Prisma } from "@eventure/database";
import type { TransactionStatus } from "@eventure/shared";
import { AppError } from "../lib/app-error.js";
import { sendTransactionAcceptedEmail, sendTransactionRejectedEmail } from "./email.service.js";

export async function checkAndRollbackExpiredTransactions(organizerId: string): Promise<void> {
  const now = new Date();
  const expired = await prisma.transaction.findMany({
    where: {
      event: { organizerId },
      status: "WAITING_FOR_CONFIRMATION",
      organizerDeadline: { lt: now },
    },
    select: { id: true },
  });

  for (const t of expired) {
    try {
      await rejectProof(
        organizerId,
        t.id,
        "Auto-rejected due to 3-day confirmation deadline expiry",
      );
    } catch (error) {
      console.error(`Failed to auto-rollback expired transaction ${t.id}:`, error);
    }
  }
}

interface TransactionRecord {
  invoiceNumber: string;
  subtotal: number;
  total: number;
  paymentProof?: { fileUrl: string; [key: string]: unknown } | null;
  [key: string]: unknown;
}

function formatTx<T extends TransactionRecord>(t: T | null) {
  if (!t) return null;
  return {
    ...t,
    code: t.invoiceNumber,
    originalAmount: t.subtotal,
    finalAmount: t.total,
    paymentProof: t.paymentProof
      ? {
          ...t.paymentProof,
          imageUrl: t.paymentProof.fileUrl,
        }
      : null,
  };
}

export async function listTransactions(
  organizerId: string,
  query: { status?: string; eventId?: string },
) {
  await checkAndRollbackExpiredTransactions(organizerId);

  const where: Prisma.TransactionWhereInput = {
    event: { organizerId, deletedAt: null },
  };

  if (query.status && query.status !== "ALL") {
    where.status = query.status as TransactionStatus;
  }
  if (query.eventId) {
    where.eventId = query.eventId;
  }

  const txs = await prisma.transaction.findMany({
    where,
    include: {
      customer: { select: { name: true, email: true } },
      event: { select: { name: true, startsAt: true, endsAt: true } },
      paymentProof: true,
      items: {
        include: {
          ticketType: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return txs.map(formatTx);
}

export async function acceptProof(organizerId: string, transactionId: string) {
  const t = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      event: { organizerId },
    },
    include: {
      customer: { select: { name: true, email: true } },
      event: { select: { name: true } },
    },
  });

  if (!t) {
    throw new AppError("Transaction not found or unauthorized", 404);
  }

  if (t.status !== "WAITING_FOR_CONFIRMATION") {
    throw new AppError("Only orders waiting for confirmation can be accepted", 400);
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: "DONE",
      completedAt: new Date(),
    },
    include: {
      customer: { select: { name: true, email: true } },
      event: { select: { name: true } },
      paymentProof: true,
      items: {
        include: { ticketType: { select: { name: true } } },
      },
    },
  });

  if (t.customer?.email) {
    void sendTransactionAcceptedEmail(
      t.customer.email,
      t.customer.name,
      t.event.name,
      t.invoiceNumber,
    );
  }

  return formatTx(updated);
}

export async function rejectProof(organizerId: string, transactionId: string, reason?: string) {
  const t = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      event: { organizerId },
    },
    include: {
      customer: { select: { name: true, email: true } },
      event: { select: { name: true } },
      items: true,
    },
  });

  if (!t) {
    throw new AppError("Transaction not found or unauthorized", 404);
  }

  if (t.status !== "WAITING_FOR_CONFIRMATION") {
    throw new AppError("Only orders waiting for confirmation can be rejected", 400);
  }

  const cancellationReason = reason ?? "Rejected by organizer";

  const updated = await prisma.$transaction(async (tx) => {
    const updatedTx = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: "REJECTED",
        cancellationReason,
        canceledAt: new Date(),
      },
      include: {
        customer: { select: { name: true, email: true } },
        event: { select: { name: true } },
        paymentProof: true,
        items: {
          include: { ticketType: { select: { name: true } } },
        },
      },
    });

    const totalQty = t.items.reduce((acc, i) => acc + i.quantity, 0);
    await tx.event.update({
      where: { id: t.eventId },
      data: { availableSeats: { increment: totalQty } },
    });

    for (const item of t.items) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { availableSeats: { increment: item.quantity } },
      });
    }

    if (t.pointsUsed > 0) {
      await tx.pointLedger.create({
        data: {
          userId: t.customerId,
          transactionId: t.id,
          type: "RESTORE",
          amount: t.pointsUsed,
          description: `Points restored due to rejected order ${t.invoiceNumber}`,
          expiresAt: null,
        },
      });
    }

    if (t.voucherId) {
      await tx.voucher.update({
        where: { id: t.voucherId },
        data: { usedCount: { decrement: 1 } },
      });
    }

    if (t.userCouponId) {
      await tx.userCoupon.update({
        where: { id: t.userCouponId },
        data: { status: "ACTIVE", redeemedAt: null },
      });
    }

    return updatedTx;
  });

  if (t.customer?.email) {
    void sendTransactionRejectedEmail(
      t.customer.email,
      t.customer.name,
      t.event.name,
      t.invoiceNumber,
      cancellationReason,
    );
  }

  return formatTx(updated);
}

export async function markAttendance(organizerId: string, transactionId: string) {
  const t = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      event: { organizerId },
    },
    include: {
      event: { select: { endsAt: true } },
    },
  });

  if (!t) {
    throw new AppError("Transaction not found or unauthorized", 404);
  }

  if (t.status !== "DONE") {
    throw new AppError("Only completed orders can be marked for attendance", 400);
  }

  if (t.event.endsAt > new Date()) {
    throw new AppError("Attendance can only be marked after the event has ended", 400);
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { isAttended: !t.isAttended },
  });

  return formatTx(updated);
}

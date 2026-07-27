import { prisma, type Prisma } from "@eventure/database";
import type { OrganizerTransactionQuery } from "@eventure/shared";
import { AppError } from "../lib/app-error.js";
import { restoreTransactionById } from "../modules/transactions/transaction-lifecycle.service.js";
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
      await restoreTransactionById(
        prisma,
        t.id,
        "WAITING_FOR_CONFIRMATION",
        "CANCELED",
        "Organizer confirmation deadline expired",
        now,
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

export async function listTransactions(organizerId: string, query: OrganizerTransactionQuery) {
  await checkAndRollbackExpiredTransactions(organizerId);

  const where: Prisma.TransactionWhereInput = {
    event: { organizerId, deletedAt: null },
  };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
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

  const transition = await prisma.transaction.updateMany({
    where: { id: transactionId, status: "WAITING_FOR_CONFIRMATION" },
    data: {
      status: "DONE",
      completedAt: new Date(),
    },
  });

  if (transition.count !== 1) {
    throw new AppError("Transaction status changed; refresh and try again", 409);
  }

  const updated = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      customer: { select: { name: true, email: true } },
      event: { select: { name: true } },
      paymentProof: true,
      items: {
        include: { ticketType: { select: { name: true } } },
      },
    },
  });

  if (!updated) {
    throw new AppError("Transaction not found", 404);
  }

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
    },
  });

  if (!t) {
    throw new AppError("Transaction not found or unauthorized", 404);
  }

  if (t.status !== "WAITING_FOR_CONFIRMATION") {
    throw new AppError("Only orders waiting for confirmation can be rejected", 400);
  }

  const cancellationReason = reason ?? "Rejected by organizer";
  const restored = await restoreTransactionById(
    prisma,
    transactionId,
    "WAITING_FOR_CONFIRMATION",
    "REJECTED",
    cancellationReason,
    new Date(),
  );

  if (!restored) {
    throw new AppError("Transaction status changed; refresh and try again", 409);
  }

  const updated = await prisma.transaction.findUnique({
    where: { id: transactionId },
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

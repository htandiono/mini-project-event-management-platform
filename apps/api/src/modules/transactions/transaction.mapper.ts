import type { Prisma } from "@eventure/database";
import type { TransactionSummary } from "@eventure/shared";

export const transactionSummarySelect = {
  id: true,
  invoiceNumber: true,
  eventId: true,
  status: true,
  subtotal: true,
  pointsUsed: true,
  voucherDiscount: true,
  couponDiscount: true,
  total: true,
  paymentDeadline: true,
  createdAt: true,
  event: { select: { name: true, slug: true, endsAt: true } },
  items: {
    select: {
      ticketTypeId: true,
      quantity: true,
      unitPrice: true,
      subtotal: true,
      ticketType: { select: { name: true } },
    },
  },
  review: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      customer: { select: { name: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.TransactionSelect;

type TransactionSummaryRecord = Prisma.TransactionGetPayload<{
  select: typeof transactionSummarySelect;
}>;

export function mapTransaction(transaction: TransactionSummaryRecord): TransactionSummary {
  return {
    id: transaction.id,
    invoiceNumber: transaction.invoiceNumber,
    eventId: transaction.eventId,
    eventName: transaction.event.name,
    eventSlug: transaction.event.slug,
    eventEndsAt: transaction.event.endsAt.toISOString(),
    status: transaction.status,
    subtotal: transaction.subtotal,
    pointsUsed: transaction.pointsUsed,
    voucherDiscount: transaction.voucherDiscount,
    couponDiscount: transaction.couponDiscount,
    total: transaction.total,
    paymentDeadline: transaction.paymentDeadline.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    items: transaction.items.map((item) => ({
      ticketTypeId: item.ticketTypeId,
      ticketTypeName: item.ticketType.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    review:
      transaction.review && !transaction.review.deletedAt
        ? {
            id: transaction.review.id,
            rating: transaction.review.rating,
            comment: transaction.review.comment,
            customerName: transaction.review.customer.name,
            customerAvatarUrl: transaction.review.customer.avatarUrl,
            createdAt: transaction.review.createdAt.toISOString(),
            updatedAt: transaction.review.updatedAt.toISOString(),
          }
        : null,
  };
}

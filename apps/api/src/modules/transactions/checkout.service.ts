import {
  PointEntryType,
  Prisma,
  TransactionStatus,
  UserCouponStatus,
  type PrismaClient,
} from "@eventure/database";
import {
  PAYMENT_PROOF_WINDOW_HOURS,
  type CheckoutInput,
  type TransactionSummary,
} from "@eventure/shared";
import { randomUUID } from "node:crypto";

import { AppError } from "../../lib/app-error.js";
import { mapTransaction, transactionSummarySelect } from "./transaction.mapper.js";

interface Discount {
  percent?: number | null;
  amount?: number | null;
}

export interface CheckoutTotals {
  subtotal: number;
  voucherDiscount: number;
  couponDiscount: number;
  pointsUsed: number;
  total: number;
}

function discountValue(base: number, discount?: Discount): number {
  if (!discount) {
    return 0;
  }

  if (discount.percent) {
    return Math.floor((base * discount.percent) / 100);
  }

  return Math.min(base, discount.amount ?? 0);
}

export function calculateCheckoutTotals(
  subtotal: number,
  pointsToUse: number,
  voucher?: Discount,
  coupon?: Discount,
): CheckoutTotals {
  const voucherDiscount = discountValue(subtotal, voucher);
  const afterVoucher = subtotal - voucherDiscount;
  const couponDiscount = discountValue(afterVoucher, coupon);
  const afterDiscounts = afterVoucher - couponDiscount;
  const pointsUsed = Math.min(pointsToUse, afterDiscounts);

  return {
    subtotal,
    voucherDiscount,
    couponDiscount,
    pointsUsed,
    total: afterDiscounts - pointsUsed,
  };
}

function normalizeItems(items: CheckoutInput["items"]): Map<string, number> {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(item.ticketTypeId, (quantities.get(item.ticketTypeId) ?? 0) + item.quantity);
  }

  return quantities;
}

function invoiceNumber(now: Date): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `EVT-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createCheckout(
  database: PrismaClient,
  customerId: string,
  input: CheckoutInput,
  now = new Date(),
): Promise<TransactionSummary> {
  return database.$transaction(
    async (transaction) => {
      const pointsToUse = input.pointsToUse ?? 0;
      const event = await transaction.event.findFirst({
        where: {
          id: input.eventId,
          deletedAt: null,
          status: "PUBLISHED",
          startsAt: { gt: now },
        },
        select: { id: true, name: true, availableSeats: true },
      });

      if (!event) {
        throw new AppError("Event is not available for checkout", 404);
      }

      const quantities = normalizeItems(input.items);
      const ticketIds = [...quantities.keys()];
      const tickets = await transaction.ticketType.findMany({
        where: { id: { in: ticketIds }, eventId: event.id, deletedAt: null },
        select: {
          id: true,
          name: true,
          price: true,
          availableSeats: true,
          salesStartAt: true,
          salesEndAt: true,
        },
      });

      if (tickets.length !== ticketIds.length) {
        throw new AppError("One or more ticket types are unavailable", 400);
      }

      let subtotal = 0;
      let totalQuantity = 0;

      for (const ticket of tickets) {
        const quantity = quantities.get(ticket.id) ?? 0;
        const salesClosed =
          (ticket.salesStartAt && ticket.salesStartAt > now) ||
          (ticket.salesEndAt && ticket.salesEndAt <= now);

        if (salesClosed || quantity > ticket.availableSeats) {
          throw new AppError(`${ticket.name} is no longer available in that quantity`, 409);
        }

        subtotal += ticket.price * quantity;
        totalQuantity += quantity;
      }

      if (totalQuantity > event.availableSeats) {
        throw new AppError("Event capacity is no longer available", 409);
      }

      const voucher = input.voucherCode
        ? await transaction.voucher.findFirst({
            where: {
              eventId: event.id,
              code: input.voucherCode,
              deletedAt: null,
              startsAt: { lte: now },
              endsAt: { gt: now },
            },
            select: {
              id: true,
              discountPercent: true,
              discountAmount: true,
              usageLimit: true,
              usedCount: true,
            },
          })
        : null;

      if (input.voucherCode && (!voucher || voucher.usedCount >= voucher.usageLimit)) {
        throw new AppError("Voucher is invalid or no longer available", 400);
      }

      const userCoupon = input.userCouponId
        ? await transaction.userCoupon.findFirst({
            where: {
              id: input.userCouponId,
              userId: customerId,
              status: { in: [UserCouponStatus.ACTIVE, UserCouponStatus.RESTORED] },
              expiresAt: { gt: now },
              coupon: { deletedAt: null },
            },
            select: { id: true, coupon: { select: { discountPercent: true } } },
          })
        : null;

      if (input.userCouponId && !userCoupon) {
        throw new AppError("Coupon is invalid or expired", 400);
      }

      const pointEntries =
        pointsToUse > 0
          ? await transaction.pointLedger.findMany({
              where: {
                userId: customerId,
                OR: [
                  {
                    type: { in: [PointEntryType.CREDIT, PointEntryType.RESTORE] },
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                  },
                  { type: PointEntryType.DEBIT },
                ],
              },
              select: { type: true, amount: true },
            })
          : [];
      const pointBalance = pointEntries.reduce(
        (balance, entry) =>
          balance + (entry.type === PointEntryType.DEBIT ? -entry.amount : entry.amount),
        0,
      );

      if (pointsToUse > pointBalance) {
        throw new AppError("Insufficient point balance", 400);
      }

      const totals = calculateCheckoutTotals(
        subtotal,
        pointsToUse,
        voucher ? { percent: voucher.discountPercent, amount: voucher.discountAmount } : undefined,
        userCoupon ? { percent: userCoupon.coupon.discountPercent } : undefined,
      );

      const eventReservation = await transaction.event.updateMany({
        where: { id: event.id, availableSeats: { gte: totalQuantity } },
        data: { availableSeats: { decrement: totalQuantity } },
      });

      if (eventReservation.count !== 1) {
        throw new AppError("Event capacity changed; please try again", 409);
      }

      for (const ticket of tickets) {
        const quantity = quantities.get(ticket.id) ?? 0;
        const reservation = await transaction.ticketType.updateMany({
          where: { id: ticket.id, availableSeats: { gte: quantity }, deletedAt: null },
          data: { availableSeats: { decrement: quantity } },
        });

        if (reservation.count !== 1) {
          throw new AppError(`${ticket.name} capacity changed; please try again`, 409);
        }
      }

      if (voucher) {
        const redemption = await transaction.voucher.updateMany({
          where: { id: voucher.id, usedCount: { lt: voucher.usageLimit }, deletedAt: null },
          data: { usedCount: { increment: 1 } },
        });

        if (redemption.count !== 1) {
          throw new AppError("Voucher was just fully redeemed", 409);
        }
      }

      if (userCoupon) {
        const redemption = await transaction.userCoupon.updateMany({
          where: {
            id: userCoupon.id,
            status: { in: [UserCouponStatus.ACTIVE, UserCouponStatus.RESTORED] },
            expiresAt: { gt: now },
          },
          data: { status: UserCouponStatus.REDEEMED, redeemedAt: now },
        });

        if (redemption.count !== 1) {
          throw new AppError("Coupon was already redeemed", 409);
        }
      }

      const isFree = totals.total === 0;
      const paymentDeadline = new Date(now.getTime() + PAYMENT_PROOF_WINDOW_HOURS * 60 * 60 * 1000);
      const created = await transaction.transaction.create({
        data: {
          invoiceNumber: invoiceNumber(now),
          customerId,
          eventId: event.id,
          voucherId: voucher?.id,
          userCouponId: userCoupon?.id,
          status: isFree ? TransactionStatus.DONE : TransactionStatus.WAITING_FOR_PAYMENT,
          ...totals,
          paymentDeadline,
          completedAt: isFree ? now : null,
          items: {
            create: tickets.map((ticket) => {
              const quantity = quantities.get(ticket.id) ?? 0;
              return {
                ticketTypeId: ticket.id,
                quantity,
                unitPrice: ticket.price,
                subtotal: ticket.price * quantity,
              };
            }),
          },
        },
        select: transactionSummarySelect,
      });

      if (totals.pointsUsed > 0) {
        await transaction.pointLedger.create({
          data: {
            userId: customerId,
            transactionId: created.id,
            type: PointEntryType.DEBIT,
            amount: totals.pointsUsed,
            description: `Points used for ${created.invoiceNumber}`,
          },
        });
      }

      return mapTransaction(created);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

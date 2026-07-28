import type { PrismaClient } from "@eventure/database";
import type { OrganizerVoucherSummary, VoucherInput } from "@eventure/shared";

import { AppError } from "../../lib/app-error.js";

async function assertPaidOwnedEvent(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
): Promise<void> {
  const event = await database.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: { isFree: true },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  if (event.isFree) {
    throw new AppError("Free events do not support discount vouchers", 400);
  }
}

function mapVoucher(voucher: {
  id: string;
  code: string;
  name: string;
  discountPercent: number | null;
  discountAmount: number | null;
  usageLimit: number;
  usedCount: number;
  startsAt: Date;
  endsAt: Date;
}): OrganizerVoucherSummary {
  return {
    ...voucher,
    startsAt: voucher.startsAt.toISOString(),
    endsAt: voucher.endsAt.toISOString(),
  };
}

async function assertUniqueVoucherCode(
  database: PrismaClient,
  code: string,
  excludedVoucherId?: string,
): Promise<void> {
  const duplicate = await database.voucher.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      ...(excludedVoucherId ? { id: { not: excludedVoucherId } } : undefined),
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError("Voucher code is already in use", 409);
  }
}

export async function listEventVouchers(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
): Promise<OrganizerVoucherSummary[]> {
  await assertPaidOwnedEvent(database, organizerId, eventId);
  const vouchers = await database.voucher.findMany({
    where: { eventId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      name: true,
      discountPercent: true,
      discountAmount: true,
      usageLimit: true,
      usedCount: true,
      startsAt: true,
      endsAt: true,
    },
  });

  return vouchers.map(mapVoucher);
}

export async function createEventVoucher(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
  input: VoucherInput,
): Promise<OrganizerVoucherSummary> {
  await assertPaidOwnedEvent(database, organizerId, eventId);
  const code = input.code.toUpperCase();
  await assertUniqueVoucherCode(database, code);
  const voucher = await database.voucher.create({
    data: {
      ...input,
      code,
      eventId,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
    },
    select: {
      id: true,
      code: true,
      name: true,
      discountPercent: true,
      discountAmount: true,
      usageLimit: true,
      usedCount: true,
      startsAt: true,
      endsAt: true,
    },
  });

  return mapVoucher(voucher);
}

export async function updateEventVoucher(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
  voucherId: string,
  input: VoucherInput,
): Promise<OrganizerVoucherSummary> {
  await assertPaidOwnedEvent(database, organizerId, eventId);
  const existing = await database.voucher.findFirst({
    where: { id: voucherId, eventId, deletedAt: null },
    select: { usedCount: true },
  });

  if (!existing) {
    throw new AppError("Voucher not found", 404);
  }

  if (input.usageLimit < existing.usedCount) {
    throw new AppError("Usage limit cannot be lower than redeemed quantity", 409);
  }

  const code = input.code.toUpperCase();
  await assertUniqueVoucherCode(database, code, voucherId);
  const voucher = await database.voucher.update({
    where: { id: voucherId },
    data: {
      ...input,
      code,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
    },
    select: {
      id: true,
      code: true,
      name: true,
      discountPercent: true,
      discountAmount: true,
      usageLimit: true,
      usedCount: true,
      startsAt: true,
      endsAt: true,
    },
  });

  return mapVoucher(voucher);
}

export async function deleteEventVoucher(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
  voucherId: string,
  now = new Date(),
): Promise<void> {
  await assertPaidOwnedEvent(database, organizerId, eventId);
  const result = await database.voucher.updateMany({
    where: { id: voucherId, eventId, deletedAt: null },
    data: { deletedAt: now },
  });

  if (result.count === 0) {
    throw new AppError("Voucher not found", 404);
  }
}

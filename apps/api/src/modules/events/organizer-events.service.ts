import { TransactionStatus, type Prisma, type PrismaClient } from "@eventure/database";
import type { EventInput, OrganizerEventDetail, OrganizerEventSummary } from "@eventure/shared";

import { AppError } from "../../lib/app-error.js";

const organizerEventSelect = {
  id: true,
  slug: true,
  name: true,
  city: true,
  startsAt: true,
  endsAt: true,
  capacity: true,
  availableSeats: true,
  isFree: true,
  status: true,
  category: { select: { name: true } },
  _count: { select: { ticketTypes: { where: { deletedAt: null } } } },
} satisfies Prisma.EventSelect;

type OrganizerEventRecord = Prisma.EventGetPayload<{ select: typeof organizerEventSelect }>;

const organizerEventDetailSelect = {
  ...organizerEventSelect,
  categoryId: true,
  description: true,
  venue: true,
  address: true,
  province: true,
  thumbnailUrl: true,
} satisfies Prisma.EventSelect;

type OrganizerEventDetailRecord = Prisma.EventGetPayload<{
  select: typeof organizerEventDetailSelect;
}>;

function mapOrganizerEvent(event: OrganizerEventRecord): OrganizerEventSummary {
  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    categoryName: event.category.name,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    capacity: event.capacity,
    availableSeats: event.availableSeats,
    isFree: event.isFree,
    status: event.status,
    ticketTypeCount: event._count.ticketTypes,
  };
}

function mapOrganizerEventDetail(event: OrganizerEventDetailRecord): OrganizerEventDetail {
  return {
    ...mapOrganizerEvent(event),
    categoryId: event.categoryId,
    description: event.description,
    venue: event.venue,
    address: event.address,
    province: event.province,
    thumbnailUrl: event.thumbnailUrl,
  };
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function createUniqueSlug(database: PrismaClient, name: string): Promise<string> {
  const base = slugify(name) || "event";
  let candidate = base;
  let suffix = 2;

  while (await database.event.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function assertActiveCategory(database: PrismaClient, categoryId: string): Promise<void> {
  const category = await database.category.findFirst({
    where: { id: categoryId, deletedAt: null },
    select: { id: true },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }
}

export async function listOrganizerEvents(
  database: PrismaClient,
  organizerId: string,
): Promise<OrganizerEventSummary[]> {
  const events = await database.event.findMany({
    where: { organizerId, deletedAt: null },
    orderBy: { startsAt: "desc" },
    select: organizerEventSelect,
  });

  return events.map(mapOrganizerEvent);
}

export async function getOrganizerEvent(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
): Promise<OrganizerEventDetail> {
  const event = await database.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: organizerEventDetailSelect,
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  return mapOrganizerEventDetail(event);
}

export async function createOrganizerEvent(
  database: PrismaClient,
  organizerId: string,
  input: EventInput,
): Promise<OrganizerEventSummary> {
  if (input.status === "PUBLISHED") {
    throw new AppError("Create the event as a draft and add a ticket type before publishing", 409);
  }

  await assertActiveCategory(database, input.categoryId);
  const slug = await createUniqueSlug(database, input.name);
  const event = await database.event.create({
    data: {
      ...input,
      slug,
      organizerId,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      availableSeats: input.capacity,
      publishedAt: null,
    },
    select: organizerEventSelect,
  });

  return mapOrganizerEvent(event);
}

export async function updateOrganizerEvent(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
  input: EventInput,
  now = new Date(),
): Promise<OrganizerEventSummary> {
  const existing = await database.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: {
      capacity: true,
      availableSeats: true,
      publishedAt: true,
      _count: { select: { ticketTypes: { where: { deletedAt: null } } } },
    },
  });

  if (!existing) {
    throw new AppError("Event not found", 404);
  }

  const bookedSeats = existing.capacity - existing.availableSeats;

  if (input.capacity < bookedSeats) {
    throw new AppError("Capacity cannot be lower than the number of booked seats", 409);
  }

  if (input.status === "PUBLISHED" && existing._count.ticketTypes === 0) {
    throw new AppError("Add at least one ticket type before publishing", 409);
  }

  if (input.capacity !== existing.capacity) {
    const allocation = await database.ticketType.aggregate({
      where: { eventId, deletedAt: null },
      _sum: { capacity: true },
    });

    if ((allocation._sum.capacity ?? 0) > input.capacity) {
      throw new AppError("Reduce ticket allocations before lowering event capacity", 409);
    }
  }

  if (input.isFree) {
    const paidTicket = await database.ticketType.findFirst({
      where: { eventId, deletedAt: null, price: { gt: 0 } },
      select: { id: true },
    });

    if (paidTicket) {
      throw new AppError("Set all ticket prices to zero before making the event free", 409);
    }
  }

  await assertActiveCategory(database, input.categoryId);
  const event = await database.event.update({
    where: { id: eventId },
    data: {
      ...input,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      availableSeats: input.capacity - bookedSeats,
      publishedAt: input.status === "PUBLISHED" ? (existing.publishedAt ?? now) : null,
    },
    select: organizerEventSelect,
  });

  return mapOrganizerEvent(event);
}

export async function deleteOrganizerEvent(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
  now = new Date(),
): Promise<void> {
  const event = await database.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: {
      id: true,
      _count: {
        select: {
          transactions: {
            where: {
              status: {
                in: [
                  TransactionStatus.WAITING_FOR_PAYMENT,
                  TransactionStatus.WAITING_FOR_CONFIRMATION,
                ],
              },
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  if (event._count.transactions > 0) {
    throw new AppError("An event with active transactions cannot be deleted", 409);
  }

  await database.$transaction([
    database.ticketType.updateMany({
      where: { eventId, deletedAt: null },
      data: { deletedAt: now },
    }),
    database.voucher.updateMany({ where: { eventId, deletedAt: null }, data: { deletedAt: now } }),
    database.event.update({ where: { id: eventId }, data: { deletedAt: now } }),
  ]);
}

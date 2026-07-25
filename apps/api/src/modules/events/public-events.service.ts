import type { EventDetail, EventSummary, PaginatedData } from "@eventure/shared";
import { EventStatus, type Prisma, type PrismaClient } from "@eventure/database";

import type { ParsedEventListQuery } from "./event.schemas.js";

const eventListSelect = {
  id: true,
  slug: true,
  name: true,
  city: true,
  venue: true,
  startsAt: true,
  thumbnailUrl: true,
  isFree: true,
  category: { select: { name: true } },
  organizer: { select: { name: true } },
  ticketTypes: {
    where: { deletedAt: null },
    select: { price: true },
  },
} satisfies Prisma.EventSelect;

type EventListRecord = Prisma.EventGetPayload<{ select: typeof eventListSelect }>;

const eventDetailSelect = {
  ...eventListSelect,
  description: true,
  address: true,
  province: true,
  endsAt: true,
  capacity: true,
  availableSeats: true,
  ticketTypes: {
    where: { deletedAt: null },
    orderBy: { price: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      capacity: true,
      availableSeats: true,
      salesStartAt: true,
      salesEndAt: true,
    },
  },
  vouchers: {
    select: {
      code: true,
      name: true,
      discountPercent: true,
      discountAmount: true,
      endsAt: true,
    },
  },
} satisfies Prisma.EventSelect;

type EventDetailRecord = Prisma.EventGetPayload<{ select: typeof eventDetailSelect }>;

function mapEventSummary(event: EventListRecord): EventSummary {
  const prices = event.ticketTypes.map((ticket) => ticket.price);

  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    categoryName: event.category.name,
    city: event.city,
    venue: event.venue,
    startsAt: event.startsAt.toISOString(),
    priceFrom: event.isFree || prices.length === 0 ? 0 : Math.min(...prices),
    imageUrl: event.thumbnailUrl,
    organizerName: event.organizer.name,
  };
}

function mapEventDetail(event: EventDetailRecord): EventDetail {
  return {
    ...mapEventSummary(event),
    description: event.description,
    address: event.address,
    province: event.province,
    endsAt: event.endsAt.toISOString(),
    capacity: event.capacity,
    availableSeats: event.availableSeats,
    ticketTypes: event.ticketTypes.map((ticket) => ({
      ...ticket,
      salesStartAt: ticket.salesStartAt?.toISOString() ?? null,
      salesEndAt: ticket.salesEndAt?.toISOString() ?? null,
    })),
    vouchers: event.vouchers.map((voucher) => ({
      ...voucher,
      endsAt: voucher.endsAt.toISOString(),
    })),
  };
}

export async function listPublishedEvents(
  database: PrismaClient,
  query: ParsedEventListQuery,
  now = new Date(),
): Promise<PaginatedData<EventSummary>> {
  const where: Prisma.EventWhereInput = {
    deletedAt: null,
    status: EventStatus.PUBLISHED,
    startsAt: { gte: now },
    AND: [{ OR: [{ isFree: true }, { ticketTypes: { some: { deletedAt: null } } }] }],
    ...(query.category
      ? { category: { is: { slug: query.category, deletedAt: null } } }
      : undefined),
    ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : undefined),
    ...(query.search
      ? {
          OR: ["name", "description", "venue", "city"].map((field) => ({
            [field]: { contains: query.search, mode: "insensitive" },
          })),
        }
      : undefined),
  };
  const skip = (query.page - 1) * query.limit;
  const orderBy: Prisma.EventOrderByWithRelationInput =
    query.sort === "name" ? { name: query.order } : { startsAt: query.order };
  const total = await database.event.count({ where });

  let events: EventSummary[];

  if (query.sort === "price") {
    const records = await database.event.findMany({ where, select: eventListSelect });
    const direction = query.order === "asc" ? 1 : -1;
    events = records
      .map(mapEventSummary)
      .sort((left, right) => (left.priceFrom - right.priceFrom) * direction)
      .slice(skip, skip + query.limit);
  } else {
    const records = await database.event.findMany({
      where,
      select: eventListSelect,
      orderBy,
      skip,
      take: query.limit,
    });
    events = records.map(mapEventSummary);
  }

  return {
    data: events,
    total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
    limit: query.limit,
  };
}

export async function getPublishedEventBySlug(
  database: PrismaClient,
  slug: string,
  now = new Date(),
): Promise<EventDetail | null> {
  const event = await database.event.findFirst({
    where: {
      slug,
      deletedAt: null,
      status: EventStatus.PUBLISHED,
    },
    select: {
      ...eventDetailSelect,
      vouchers: {
        ...eventDetailSelect.vouchers,
        where: {
          deletedAt: null,
          startsAt: { lte: now },
          endsAt: { gt: now },
          usedCount: { lt: database.voucher.fields.usageLimit },
        },
      },
    },
  });

  return event ? mapEventDetail(event) : null;
}

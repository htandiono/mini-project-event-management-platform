import type { PrismaClient } from "@eventure/database";
import type { TicketTypeInput, TicketTypeSummary } from "@eventure/shared";

import { AppError } from "../../lib/app-error.js";

async function findOwnedEvent(database: PrismaClient, organizerId: string, eventId: string) {
  const event = await database.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: { id: true, capacity: true, isFree: true },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  return event;
}

function mapTicket(ticket: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number;
  availableSeats: number;
  salesStartAt: Date | null;
  salesEndAt: Date | null;
}): TicketTypeSummary {
  return {
    ...ticket,
    salesStartAt: ticket.salesStartAt?.toISOString() ?? null,
    salesEndAt: ticket.salesEndAt?.toISOString() ?? null,
  };
}

async function assertTicketAllocation(
  database: PrismaClient,
  eventId: string,
  eventCapacity: number,
  requestedCapacity: number,
  excludedTicketId?: string,
): Promise<void> {
  const allocation = await database.ticketType.aggregate({
    where: {
      eventId,
      deletedAt: null,
      ...(excludedTicketId ? { id: { not: excludedTicketId } } : undefined),
    },
    _sum: { capacity: true },
  });

  if ((allocation._sum.capacity ?? 0) + requestedCapacity > eventCapacity) {
    throw new AppError("Ticket allocation cannot exceed event capacity", 409);
  }
}

async function assertUniqueTicketName(
  database: PrismaClient,
  eventId: string,
  name: string,
  excludedTicketId?: string,
): Promise<void> {
  const duplicate = await database.ticketType.findFirst({
    where: {
      eventId,
      name: { equals: name, mode: "insensitive" },
      deletedAt: null,
      ...(excludedTicketId ? { id: { not: excludedTicketId } } : undefined),
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError("A ticket type with this name already exists", 409);
  }
}

export async function listEventTickets(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
): Promise<TicketTypeSummary[]> {
  await findOwnedEvent(database, organizerId, eventId);
  const tickets = await database.ticketType.findMany({
    where: { eventId, deletedAt: null },
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
  });

  return tickets.map(mapTicket);
}

export async function createEventTicket(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
  input: TicketTypeInput,
): Promise<TicketTypeSummary> {
  const event = await findOwnedEvent(database, organizerId, eventId);

  if (event.isFree && input.price !== 0) {
    throw new AppError("Ticket price must be zero for a free event", 400);
  }

  await Promise.all([
    assertTicketAllocation(database, eventId, event.capacity, input.capacity),
    assertUniqueTicketName(database, eventId, input.name),
  ]);
  const ticket = await database.ticketType.create({
    data: {
      ...input,
      eventId,
      availableSeats: input.capacity,
      salesStartAt: input.salesStartAt ? new Date(input.salesStartAt) : null,
      salesEndAt: input.salesEndAt ? new Date(input.salesEndAt) : null,
    },
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
  });

  return mapTicket(ticket);
}

export async function updateEventTicket(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
  ticketId: string,
  input: TicketTypeInput,
): Promise<TicketTypeSummary> {
  const event = await findOwnedEvent(database, organizerId, eventId);
  const existing = await database.ticketType.findFirst({
    where: { id: ticketId, eventId, deletedAt: null },
    select: { capacity: true, availableSeats: true },
  });

  if (!existing) {
    throw new AppError("Ticket type not found", 404);
  }

  if (event.isFree && input.price !== 0) {
    throw new AppError("Ticket price must be zero for a free event", 400);
  }

  const soldSeats = existing.capacity - existing.availableSeats;

  if (input.capacity < soldSeats) {
    throw new AppError("Ticket capacity cannot be lower than sold quantity", 409);
  }

  await Promise.all([
    assertTicketAllocation(database, eventId, event.capacity, input.capacity, ticketId),
    assertUniqueTicketName(database, eventId, input.name, ticketId),
  ]);
  const ticket = await database.ticketType.update({
    where: { id: ticketId },
    data: {
      ...input,
      availableSeats: input.capacity - soldSeats,
      salesStartAt: input.salesStartAt ? new Date(input.salesStartAt) : null,
      salesEndAt: input.salesEndAt ? new Date(input.salesEndAt) : null,
    },
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
  });

  return mapTicket(ticket);
}

export async function deleteEventTicket(
  database: PrismaClient,
  organizerId: string,
  eventId: string,
  ticketId: string,
  now = new Date(),
): Promise<void> {
  await findOwnedEvent(database, organizerId, eventId);
  const ticket = await database.ticketType.findFirst({
    where: { id: ticketId, eventId, deletedAt: null },
    select: { capacity: true, availableSeats: true },
  });

  if (!ticket) {
    throw new AppError("Ticket type not found", 404);
  }

  if (ticket.availableSeats !== ticket.capacity) {
    throw new AppError("A ticket type with sold tickets cannot be deleted", 409);
  }

  await database.ticketType.update({ where: { id: ticketId }, data: { deletedAt: now } });
}

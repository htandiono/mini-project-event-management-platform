import { prisma } from "@eventure/database";
import type { ApiSuccess, TicketTypeSummary } from "@eventure/shared";
import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler.js";
import { requireRequestUser } from "../../lib/request-user.js";
import { entityIdSchema, ticketTypeInputSchema } from "./event.schemas.js";
import {
  createEventTicket,
  deleteEventTicket,
  listEventTickets,
  updateEventTicket,
} from "./event-tickets.service.js";

export const eventTicketsRouter = Router({ mergeParams: true });

eventTicketsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const tickets = await listEventTickets(prisma, organizer.id, eventId);
    const body: ApiSuccess<TicketTypeSummary[]> = {
      success: true,
      message: "Ticket types retrieved",
      data: tickets,
    };

    response.json(body);
  }),
);

eventTicketsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const input = ticketTypeInputSchema.parse(request.body);
    const ticket = await createEventTicket(prisma, organizer.id, eventId, input);
    const body: ApiSuccess<TicketTypeSummary> = {
      success: true,
      message: "Ticket type created",
      data: ticket,
    };

    response.status(201).json(body);
  }),
);

eventTicketsRouter.put(
  "/:ticketId",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const ticketId = entityIdSchema.parse(request.params.ticketId);
    const input = ticketTypeInputSchema.parse(request.body);
    const ticket = await updateEventTicket(prisma, organizer.id, eventId, ticketId, input);
    const body: ApiSuccess<TicketTypeSummary> = {
      success: true,
      message: "Ticket type updated",
      data: ticket,
    };

    response.json(body);
  }),
);

eventTicketsRouter.delete(
  "/:ticketId",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const ticketId = entityIdSchema.parse(request.params.ticketId);
    await deleteEventTicket(prisma, organizer.id, eventId, ticketId);

    response.status(204).send();
  }),
);

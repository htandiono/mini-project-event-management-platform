import { prisma } from "@eventure/database";
import type { ApiSuccess, OrganizerEventSummary } from "@eventure/shared";
import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler.js";
import { requireRequestUser } from "../../lib/request-user.js";
import { entityIdSchema, eventInputSchema } from "./event.schemas.js";
import {
  createOrganizerEvent,
  deleteOrganizerEvent,
  listOrganizerEvents,
  updateOrganizerEvent,
} from "./organizer-events.service.js";

export const organizerEventsRouter = Router();

organizerEventsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const events = await listOrganizerEvents(prisma, organizer.id);
    const body: ApiSuccess<OrganizerEventSummary[]> = {
      success: true,
      message: "Organizer events retrieved",
      data: events,
    };

    response.json(body);
  }),
);

organizerEventsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const input = eventInputSchema.parse(request.body);
    const event = await createOrganizerEvent(prisma, organizer.id, input);
    const body: ApiSuccess<OrganizerEventSummary> = {
      success: true,
      message: "Event created",
      data: event,
    };

    response.status(201).json(body);
  }),
);

organizerEventsRouter.put(
  "/:eventId",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const input = eventInputSchema.parse(request.body);
    const event = await updateOrganizerEvent(prisma, organizer.id, eventId, input);
    const body: ApiSuccess<OrganizerEventSummary> = {
      success: true,
      message: "Event updated",
      data: event,
    };

    response.json(body);
  }),
);

organizerEventsRouter.delete(
  "/:eventId",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    await deleteOrganizerEvent(prisma, organizer.id, eventId);

    response.status(204).send();
  }),
);

import { prisma } from "@eventure/database";
import type { ApiSuccess, CategorySummary, EventSummary, PaginatedData } from "@eventure/shared";
import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler.js";
import { AppError } from "../../lib/app-error.js";
import { eventListQuerySchema, eventSlugSchema } from "./event.schemas.js";
import { getPublishedEventBySlug, listPublishedEvents } from "./public-events.service.js";

export const publicEventsRouter = Router();

publicEventsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = eventListQuerySchema.parse(request.query);
    const events = await listPublishedEvents(prisma, query);
    const body: ApiSuccess<PaginatedData<EventSummary>> = {
      success: true,
      message: "Events retrieved",
      data: events,
    };

    response.json(body);
  }),
);

publicEventsRouter.get(
  "/categories",
  asyncHandler(async (_request, response) => {
    const categories: CategorySummary[] = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    const body: ApiSuccess<CategorySummary[]> = {
      success: true,
      message: "Categories retrieved",
      data: categories,
    };

    response.json(body);
  }),
);

publicEventsRouter.get(
  "/:slug",
  asyncHandler(async (request, response) => {
    const slug = eventSlugSchema.parse(request.params.slug);
    const event = await getPublishedEventBySlug(prisma, slug);

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const body: ApiSuccess<typeof event> = {
      success: true,
      message: "Event retrieved",
      data: event,
    };

    response.json(body);
  }),
);

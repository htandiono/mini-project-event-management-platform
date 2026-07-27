import { dashboardQuerySchema } from "@eventure/shared";
import type { Request, Response } from "express";
import { AppError } from "../lib/app-error.js";
import { asyncHandler } from "../lib/async-handler.js";
import * as dashboardService from "../services/dashboard.service.js";

export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const query = dashboardQuerySchema.parse(req.query);
  const stats = await dashboardService.getStatistics(req.user.id, query);
  res.status(200).json({
    success: true,
    message: "Dashboard statistics retrieved successfully",
    data: stats,
  });
});

export const getAttendees = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const eventId = req.params.id as string;
  const attendees = await dashboardService.getAttendees(req.user.id, eventId);
  res.status(200).json({
    success: true,
    message: "Attendees retrieved successfully",
    data: {
      items: attendees,
      total: attendees.length,
      page: 1,
      limit: attendees.length,
    },
  });
});

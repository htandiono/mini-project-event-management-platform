import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, authorize("ORGANIZER"));

dashboardRouter.get("/statistics", dashboardController.getStatistics);
dashboardRouter.get("/events/:id/attendees", dashboardController.getAttendees);

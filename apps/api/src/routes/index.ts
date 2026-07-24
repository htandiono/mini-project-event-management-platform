import { Router } from "express";

import { healthRouter } from "./health.route.js";
import { publicEventsRouter } from "../modules/events/public-events.route.js";
import { organizerEventsRouter } from "../modules/events/organizer-events.route.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/events", publicEventsRouter);
apiRouter.use("/organizer/events", organizerEventsRouter);

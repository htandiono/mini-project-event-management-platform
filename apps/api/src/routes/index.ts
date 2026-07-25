import { Router } from "express";

import { healthRouter } from "./health.route.js";
import { publicEventsRouter } from "../modules/events/public-events.route.js";
import { eventTicketsRouter } from "../modules/events/event-tickets.route.js";
import { eventVouchersRouter } from "../modules/events/event-vouchers.route.js";
import { organizerEventsRouter } from "../modules/events/organizer-events.route.js";
import { transactionsRouter } from "../modules/transactions/transactions.route.js";
import { reviewsRouter } from "../modules/transactions/reviews.route.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/events", publicEventsRouter);
apiRouter.use("/organizer/events", organizerEventsRouter);
apiRouter.use("/organizer/events/:eventId/tickets", eventTicketsRouter);
apiRouter.use("/organizer/events/:eventId/vouchers", eventVouchersRouter);
apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/transactions/:transactionId/review", reviewsRouter);

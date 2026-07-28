import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { healthRouter } from "./health.route.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { publicEventsRouter } from "../modules/events/public-events.route.js";
import { eventTicketsRouter } from "../modules/events/event-tickets.route.js";
import { eventVouchersRouter } from "../modules/events/event-vouchers.route.js";
import { organizerEventsRouter } from "../modules/events/organizer-events.route.js";
import { transactionsRouter } from "../modules/transactions/transactions.route.js";
import { reviewsRouter } from "../modules/transactions/reviews.route.js";
import { transactionRouter } from "./transaction.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/events", publicEventsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/organizer/events", authenticate, authorize("ORGANIZER"), organizerEventsRouter);
apiRouter.use(
  "/organizer/events/:eventId/tickets",
  authenticate,
  authorize("ORGANIZER"),
  eventTicketsRouter,
);
apiRouter.use(
  "/organizer/events/:eventId/vouchers",
  authenticate,
  authorize("ORGANIZER"),
  eventVouchersRouter,
);
apiRouter.use("/organizer/transactions", transactionRouter);
apiRouter.use("/transactions", authenticate, authorize("CUSTOMER"), transactionsRouter);
apiRouter.use(
  "/transactions/:transactionId/review",
  authenticate,
  authorize("CUSTOMER"),
  reviewsRouter,
);

import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { healthRouter } from "./health.route.js";
import { transactionRouter } from "./transaction.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/transactions", transactionRouter);

import { rejectTransactionSchema } from "@eventure/shared";
import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

export const transactionRouter = Router();

transactionRouter.use(authenticate, authorize("ORGANIZER"));

transactionRouter.get("/", transactionController.listTransactions);
transactionRouter.patch("/:id/accept", transactionController.acceptProof);
transactionRouter.patch(
  "/:id/reject",
  validate({ body: rejectTransactionSchema }),
  transactionController.rejectProof,
);
transactionRouter.patch("/:id/attend", transactionController.markAttendance);

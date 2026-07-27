import { prisma } from "@eventure/database";
import type { ApiSuccess, ReviewSummary } from "@eventure/shared";
import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler.js";
import { requireRequestUser } from "../../lib/request-user.js";
import {
  createTransactionReview,
  deleteTransactionReview,
  updateTransactionReview,
} from "./reviews.service.js";
import { reviewInputSchema, transactionIdSchema } from "./transaction.schemas.js";

export const reviewsRouter = Router({ mergeParams: true });

reviewsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const transactionId = transactionIdSchema.parse(request.params.transactionId);
    const input = reviewInputSchema.parse(request.body);
    const review = await createTransactionReview(prisma, customer.id, transactionId, input);
    const body: ApiSuccess<ReviewSummary> = {
      success: true,
      message: "Review created",
      data: review,
    };

    response.status(201).json(body);
  }),
);

reviewsRouter.put(
  "/",
  asyncHandler(async (request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const transactionId = transactionIdSchema.parse(request.params.transactionId);
    const input = reviewInputSchema.parse(request.body);
    const review = await updateTransactionReview(prisma, customer.id, transactionId, input);
    const body: ApiSuccess<ReviewSummary> = {
      success: true,
      message: "Review updated",
      data: review,
    };

    response.json(body);
  }),
);

reviewsRouter.delete(
  "/",
  asyncHandler(async (request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const transactionId = transactionIdSchema.parse(request.params.transactionId);
    await deleteTransactionReview(prisma, customer.id, transactionId);

    response.status(204).send();
  }),
);

import { prisma } from "@eventure/database";
import type { ApiSuccess, TransactionSummary } from "@eventure/shared";
import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler.js";
import { requireRequestUser } from "../../lib/request-user.js";
import { createCheckout } from "./checkout.service.js";
import { checkoutInputSchema } from "./transaction.schemas.js";

export const transactionsRouter = Router();

transactionsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const input = checkoutInputSchema.parse(request.body);
    const transaction = await createCheckout(prisma, customer.id, input);
    const body: ApiSuccess<TransactionSummary> = {
      success: true,
      message: "Checkout created",
      data: transaction,
    };

    response.status(201).json(body);
  }),
);

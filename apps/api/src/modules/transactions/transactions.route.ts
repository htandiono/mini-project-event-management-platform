import { prisma } from "@eventure/database";
import type { ApiSuccess, PaymentProofSubmission, TransactionSummary } from "@eventure/shared";
import { Router } from "express";

import { AppError } from "../../lib/app-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireRequestUser } from "../../lib/request-user.js";
import { uploadPaymentProof } from "../../middleware/upload.js";
import { createCheckout } from "./checkout.service.js";
import { getCheckoutOptions } from "./checkout-options.service.js";
import { submitPaymentProof } from "./payment-proof.service.js";
import {
  cancelCustomerTransaction,
  getCustomerTransaction,
  listCustomerTransactions,
} from "./transaction-lifecycle.service.js";
import { checkoutInputSchema, transactionIdSchema } from "./transaction.schemas.js";

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

transactionsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const transactions = await listCustomerTransactions(prisma, customer.id);
    const body: ApiSuccess<TransactionSummary[]> = {
      success: true,
      message: "Transactions retrieved",
      data: transactions,
    };

    response.json(body);
  }),
);

transactionsRouter.get(
  "/options",
  asyncHandler(async (_request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const options = await getCheckoutOptions(prisma, customer.id);
    const body: ApiSuccess<typeof options> = {
      success: true,
      message: "Checkout options retrieved",
      data: options,
    };

    response.json(body);
  }),
);

transactionsRouter.get(
  "/:transactionId",
  asyncHandler(async (request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const transactionId = transactionIdSchema.parse(request.params.transactionId);
    const transaction = await getCustomerTransaction(prisma, customer.id, transactionId);
    const body: ApiSuccess<TransactionSummary> = {
      success: true,
      message: "Transaction retrieved",
      data: transaction,
    };

    response.json(body);
  }),
);

transactionsRouter.post(
  "/:transactionId/payment-proof",
  uploadPaymentProof,
  asyncHandler(async (request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const transactionId = transactionIdSchema.parse(request.params.transactionId);

    if (!request.file) {
      throw new AppError("Payment proof image is required", 400);
    }

    const submission = await submitPaymentProof(prisma, customer.id, transactionId, request.file);
    const body: ApiSuccess<PaymentProofSubmission> = {
      success: true,
      message: "Payment proof uploaded",
      data: submission,
    };

    response.json(body);
  }),
);

transactionsRouter.post(
  "/:transactionId/cancel",
  asyncHandler(async (request, response) => {
    const customer = requireRequestUser(response.locals, "CUSTOMER");
    const transactionId = transactionIdSchema.parse(request.params.transactionId);
    await cancelCustomerTransaction(prisma, customer.id, transactionId);

    response.status(204).send();
  }),
);

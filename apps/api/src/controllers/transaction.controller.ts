import type { OrganizerTransactionQuery } from "@eventure/shared";
import type { Request, Response } from "express";
import { AppError } from "../lib/app-error.js";
import { asyncHandler } from "../lib/async-handler.js";
import * as transactionService from "../services/transaction-decision.service.js";

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const transactions = await transactionService.listTransactions(
    req.user.id,
    req.query as OrganizerTransactionQuery,
  );
  res.status(200).json({
    success: true,
    message: "Transactions retrieved successfully",
    data: transactions,
  });
});

export const acceptProof = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = req.params.id as string;
  const accepted = await transactionService.acceptProof(req.user.id, id);
  res.status(200).json({
    success: true,
    message: "Payment proof accepted successfully",
    data: accepted,
  });
});

export const rejectProof = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = req.params.id as string;
  const body = req.body as unknown;
  const reason =
    typeof body === "object" &&
    body !== null &&
    "reason" in body &&
    typeof (body as Record<string, unknown>).reason === "string"
      ? ((body as Record<string, unknown>).reason as string)
      : undefined;
  const rejected = await transactionService.rejectProof(req.user.id, id, reason);
  res.status(200).json({
    success: true,
    message: "Payment proof rejected successfully",
    data: rejected,
  });
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = req.params.id as string;
  const updated = await transactionService.markAttendance(req.user.id, id);
  res.status(200).json({
    success: true,
    message: "Attendance marked successfully",
    data: updated,
  });
});

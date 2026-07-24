import { z } from "zod";

export const TRANSACTION_STATUSES = [
  "WAITING_FOR_PAYMENT",
  "WAITING_FOR_CONFIRMATION",
  "DONE",
  "REJECTED",
  "EXPIRED",
  "CANCELED",
] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  WAITING_FOR_PAYMENT: "Waiting for payment",
  WAITING_FOR_CONFIRMATION: "Waiting for confirmation",
  DONE: "Done",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CANCELED: "Canceled",
};

export const PAYMENT_PROOF_WINDOW_HOURS = 2;
export const ORGANIZER_REVIEW_WINDOW_DAYS = 3;

export const rejectTransactionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type RejectTransactionDTO = z.infer<typeof rejectTransactionSchema>;

export interface AttendeeListItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  ticketTypeName: string;
  quantity: number;
  totalPaid: number;
  isAttended: boolean;
  createdAt: string;
}

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

export interface CheckoutItemInput {
  ticketTypeId: string;
  quantity: number;
}

export interface CheckoutInput {
  eventId: string;
  items: CheckoutItemInput[];
  voucherCode?: string;
  userCouponId?: string;
  pointsToUse?: number;
}

export interface CheckoutCouponOption {
  id: string;
  name: string;
  discountPercent: number;
  expiresAt: string;
}

export interface CheckoutOptions {
  pointBalance: number;
  coupons: CheckoutCouponOption[];
}

export interface TransactionItemSummary {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface TransactionSummary {
  id: string;
  invoiceNumber: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventEndsAt: string;
  status: TransactionStatus;
  subtotal: number;
  pointsUsed: number;
  voucherDiscount: number;
  couponDiscount: number;
  total: number;
  paymentDeadline: string;
  createdAt: string;
  items: TransactionItemSummary[];
  review: ReviewSummary | null;
}

export interface PaymentProofSubmission {
  transactionId: string;
  status: "WAITING_FOR_CONFIRMATION";
  paymentUploadedAt: string;
  organizerDeadline: string;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}

export interface ReviewSummary extends ReviewInput {
  id: string;
  customerName: string;
  customerAvatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventReviews {
  averageRating: number;
  reviewCount: number;
  reviews: ReviewSummary[];
}

export const rejectTransactionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type RejectTransactionDTO = z.infer<typeof rejectTransactionSchema>;

export const organizerTransactionQuerySchema = z.object({
  status: z.enum(["ALL", ...TRANSACTION_STATUSES]).optional(),
  eventId: z.string().trim().min(1).max(40).optional(),
});

export type OrganizerTransactionQuery = z.infer<typeof organizerTransactionQuerySchema>;

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

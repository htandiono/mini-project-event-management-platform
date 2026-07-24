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
  status: TransactionStatus;
  subtotal: number;
  pointsUsed: number;
  voucherDiscount: number;
  couponDiscount: number;
  total: number;
  paymentDeadline: string;
  createdAt: string;
  items: TransactionItemSummary[];
}

export interface ReviewInput {
  rating: number;
  comment: string;
}

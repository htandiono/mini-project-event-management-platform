import type { RejectTransactionDTO } from "@eventure/shared";
import { fetchApi } from "./client";

export interface OrganizerTransactionItem {
  id: string;
  code: string;
  invoiceNumber?: string;
  customerId: string;
  eventId: string;
  originalAmount: number;
  subtotal?: number;
  pointsUsed: number;
  couponDiscount: number;
  voucherDiscount: number;
  finalAmount: number;
  total?: number;
  status:
    | "WAITING_FOR_PAYMENT"
    | "WAITING_FOR_CONFIRMATION"
    | "DONE"
    | "REJECTED"
    | "EXPIRED"
    | "CANCELED";
  attendedAt: string | null;
  organizerDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; email: string };
  event: { name: string; startsAt: string; endsAt: string };
  paymentProof?: { id: string; imageUrl?: string; fileUrl?: string; uploadedAt: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    ticketType: { name: string };
  }>;
}

export const transactionsApi = {
  listTransactions: (params?: { status?: string; eventId?: string }) =>
    fetchApi<OrganizerTransactionItem[]>("/transactions", { method: "GET", params }),

  acceptProof: (id: string) =>
    fetchApi<OrganizerTransactionItem>(`/transactions/${id}/accept`, { method: "PATCH" }),

  rejectProof: (id: string, data: RejectTransactionDTO) =>
    fetchApi<OrganizerTransactionItem>(`/transactions/${id}/reject`, { method: "PATCH", data }),

  markAttendance: (id: string) =>
    fetchApi<OrganizerTransactionItem>(`/transactions/${id}/attend`, { method: "PATCH" }),
};

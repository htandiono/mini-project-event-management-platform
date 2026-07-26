import type { ChangePasswordDTO, UpdateProfileDTO, UserResponse } from "@eventure/shared";
import { apiClient, fetchApi } from "./client";

export interface PointHistoryItem {
  id: string;
  type: "CREDIT" | "DEBIT" | "EXPIRE" | "RESTORE" | string;
  amount: number;
  reason: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface CouponItem {
  id: string;
  userId: string;
  couponId: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | string;
  redeemedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  coupon: {
    code: string;
    name: string;
    discountPercent: number | null;
  };
}

export interface ReferralHistoryItem {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface UserOrderItem {
  id: string;
  transactionId: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  ticketType: { name: string };
}

export interface UserOrder {
  id: string;
  code: string;
  customerId: string;
  eventId: string;
  originalAmount: number;
  pointsUsed: number;
  couponDiscount: number;
  voucherDiscount: number;
  finalAmount: number;
  status:
    | "WAITING_FOR_PAYMENT"
    | "WAITING_FOR_CONFIRMATION"
    | "DONE"
    | "REJECTED"
    | "EXPIRED"
    | "CANCELED";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    name: string;
    slug?: string;
    startsAt?: string;
    endsAt?: string;
    venue?: string;
    city?: string;
  };
  items?: UserOrderItem[];
  paymentProof?: {
    id: string;
    imageUrl: string;
    uploadedAt: string;
  } | null;
}

export const userApi = {
  getProfile: () => fetchApi<UserResponse>("/users/me", { method: "GET" }),

  updateProfile: async (data: UpdateProfileDTO, avatar?: File) => {
    const formData = new FormData();
    if (data.name !== undefined) {
      formData.append("name", data.name);
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }
    const response = await apiClient.patch("/users/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data as UserResponse;
  },

  changePassword: (data: ChangePasswordDTO) =>
    fetchApi<UserResponse>("/users/me/password", { method: "PATCH", data }),

  getPointsHistory: () => fetchApi<PointHistoryItem[]>("/users/me/points", { method: "GET" }),

  getCoupons: () => fetchApi<CouponItem[]>("/users/me/coupons", { method: "GET" }),

  getReferrals: () => fetchApi<ReferralHistoryItem[]>("/users/me/referrals", { method: "GET" }),

  getUserOrders: (params?: { page?: number; limit?: number }) =>
    fetchApi<UserOrder[]>("/users/me/orders", { method: "GET", params }),
};

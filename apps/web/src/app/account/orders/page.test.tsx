import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { userApi, type UserOrder } from "@/lib/api/user.api";

import UserOrdersPage from "./page";

vi.mock("@/lib/api/user.api", () => ({
  userApi: { getUserOrders: vi.fn() },
}));

const order: UserOrder = {
  id: "transaction-1",
  invoiceNumber: "INV-2026-001",
  customerId: "customer-1",
  eventId: "event-1",
  subtotal: 150_000,
  pointsUsed: 10_000,
  couponDiscount: 15_000,
  voucherDiscount: 0,
  total: 125_000,
  status: "WAITING_FOR_PAYMENT",
  paymentDeadline: "2026-10-01T05:00:00.000Z",
  createdAt: "2026-10-01T03:00:00.000Z",
  updatedAt: "2026-10-01T03:00:00.000Z",
  event: { name: "Jakarta Creative Expo" },
  items: [
    {
      id: "item-1",
      transactionId: "transaction-1",
      ticketTypeId: "ticket-1",
      quantity: 1,
      unitPrice: 150_000,
      subtotal: 150_000,
      ticketType: { name: "General Admission" },
    },
  ],
  paymentProof: null,
};

describe("UserOrdersPage", () => {
  it("renders the invoice number and total returned by the orders API", async () => {
    vi.mocked(userApi.getUserOrders).mockResolvedValue([order]);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserOrdersPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("INV-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Rp 125.000")).toBeInTheDocument();
    expect(screen.getByText("Jakarta Creative Expo")).toBeInTheDocument();
  });
});

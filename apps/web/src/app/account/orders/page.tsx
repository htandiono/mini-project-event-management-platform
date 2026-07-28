"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi, type UserOrder, type UserOrderItem } from "@/lib/api/user.api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function UserOrdersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["userOrders", page],
    queryFn: () => userApi.getUserOrders({ page, limit }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return <span className="badge badge--success">Completed</span>;
      case "WAITING_FOR_PAYMENT":
        return <span className="badge badge--warning">Waiting Payment</span>;
      case "WAITING_FOR_CONFIRMATION":
        return <span className="badge badge--info">Verifying Proof</span>;
      case "REJECTED":
        return <span className="badge badge--error">Proof Rejected</span>;
      case "EXPIRED":
      case "CANCELED":
      default:
        return (
          <span className="badge badge--error" style={{ background: "#f1f3f4", color: "#5f6368" }}>
            {status}
          </span>
        );
    }
  };

  const orders = ordersData || [];

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-lg)",
        padding: "2rem",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div
        style={{
          paddingBottom: "1.5rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--color-line)",
        }}
      >
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", margin: "0 0 0.4rem 0" }}>
          My Orders
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.92rem" }}>
          Review your event ticket registrations and payment statuses.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Skeleton width="100%" height="3.5rem" />
          <Skeleton width="100%" height="3.5rem" />
          <Skeleton width="100%" height="3.5rem" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="You haven't registered for any events yet. Explore events and join the fun!"
        />
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Event Name</th>
                  <th>Tickets</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Order Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: UserOrder) => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: "700" }}>
                      {order.invoiceNumber}
                    </td>
                    <td style={{ fontWeight: "650", color: "var(--color-ink)" }}>
                      {order.event?.name || "Event Details"}
                    </td>
                    <td>
                      {order.items?.map((item: UserOrderItem, i: number) => (
                        <div key={i} style={{ fontSize: "0.85rem" }}>
                          {item.quantity}x {item.ticketType?.name || "Ticket"}
                        </div>
                      )) || "—"}
                    </td>
                    <td style={{ fontWeight: "700" }}>Rp {order.total.toLocaleString("id-ID")}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        timeZone: "Asia/Jakarta",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--color-line)",
            }}
          >
            <span style={{ fontSize: "0.88rem", color: "var(--color-muted)" }}>
              Showing up to {limit} items per page
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="button button--ghost"
                style={{ padding: "0.4rem 0.75rem", minHeight: "2.2rem" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                type="button"
                className="button button--ghost"
                style={{ padding: "0.4rem 0.75rem", minHeight: "2.2rem" }}
                disabled={orders.length < limit}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

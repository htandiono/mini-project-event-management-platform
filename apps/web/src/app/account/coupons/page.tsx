"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi, type CouponItem } from "@/lib/api/user.api";
import { Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function CouponsPage() {
  const { data: coupons, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: userApi.getCoupons,
  });

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
          My Coupons
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.92rem" }}>
          Use these discount coupons at checkout when purchasing event tickets.
        </p>
      </div>

      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))",
            gap: "1.5rem",
          }}
        >
          <Skeleton height="10rem" borderRadius="var(--radius-md)" />
          <Skeleton height="10rem" borderRadius="var(--radius-md)" />
        </div>
      ) : !coupons || coupons.length === 0 ? (
        <EmptyState
          title="No coupons available"
          description="You don't have any active discount coupons right now. Keep an eye out for special promotions!"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))",
            gap: "1.5rem",
          }}
        >
          {coupons.map((item: CouponItem) => {
            const isExpired = new Date(item.expiresAt) < new Date();
            const isUsed = !!item.redeemedAt || item.status === "USED";
            const isValid = !isUsed && !isExpired;
            const code = item.coupon?.code || "COUPON";
            const discountPercent = item.coupon?.discountPercent || 100;
            const name = item.coupon?.name || "Discount Voucher";

            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid",
                  borderColor: isValid ? "var(--color-teal)" : "var(--color-line)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.5rem",
                  background: isValid ? "rgba(23, 109, 101, 0.03)" : "var(--color-canvas)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem",
                  opacity: isValid ? 1 : 0.7,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        background: isValid ? "var(--color-teal)" : "var(--color-muted)",
                        color: "white",
                      }}
                    >
                      {code}
                    </span>
                    {isValid ? (
                      <span
                        className="badge badge--success"
                        style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <Clock size={12} /> Active
                      </span>
                    ) : isUsed ? (
                      <span className="badge badge--warning">Used</span>
                    ) : (
                      <span className="badge badge--error">Expired</span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "1.25rem",
                      margin: "0 0 0.5rem 0",
                      color: "var(--color-ink)",
                    }}
                  >
                    {discountPercent}% OFF
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted)" }}>
                    {name}
                  </p>
                </div>

                <div
                  style={{
                    paddingTop: "0.85rem",
                    borderTop: "1px dashed var(--color-line)",
                    fontSize: "0.8rem",
                    color: "var(--color-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Calendar size={14} />
                  <span>
                    Expires:{" "}
                    {new Date(item.expiresAt).toLocaleDateString("en-US", {
                      timeZone: "Asia/Jakarta",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

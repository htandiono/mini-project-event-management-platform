"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user.api";
import { Sparkles, Calendar, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function PointsHistoryPage() {
  const { data: pointsHistory, isLoading } = useQuery({
    queryKey: ["pointsHistory"],
    queryFn: userApi.getPointsHistory,
  });

  const activePoints = (pointsHistory || []).reduce((acc, item) => {
    if (item.type === "CREDIT" || item.type === "RESTORE") return acc + item.amount;
    if (item.type === "DEBIT" || item.type === "EXPIRE") return acc - item.amount;
    return acc;
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div>
            <h1
              style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", margin: "0 0 0.4rem 0" }}
            >
              Points History
            </h1>
            <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.92rem" }}>
              Track all point credits, redemptions, and expirations.
            </p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, var(--color-night), #32435c)",
              color: "white",
              padding: "1rem 1.5rem",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              border: "1px solid rgba(229, 170, 61, 0.4)",
            }}
          >
            <Sparkles size={28} style={{ color: "var(--color-gold)" }} />
            <div>
              <span
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "#c3cad1",
                  display: "block",
                  fontWeight: "650",
                }}
              >
                Current Balance
              </span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", fontWeight: "700" }}>
                {activePoints.toLocaleString("id-ID")} pts
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "1.5rem",
            background: "rgba(229, 170, 61, 0.1)",
            border: "1px solid rgba(229, 170, 61, 0.3)",
            borderRadius: "var(--radius-sm)",
            padding: "1rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            fontSize: "0.88rem",
            color: "#855800",
          }}
        >
          <Info size={18} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
          <span>
            <strong>Expiration Policy:</strong> Earned reward points are valid for exactly 3 months
            from the date they are credited. Unused points will automatically expire and be deducted
            from your balance.
          </span>
        </div>
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", margin: "0 0 1.5rem 0" }}>Transaction Ledger</h2>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
          </div>
        ) : !pointsHistory || pointsHistory.length === 0 ? (
          <EmptyState
            title="No points history"
            description="You haven't earned or spent any reward points yet."
          />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description / Reason</th>
                  <th>Date Recorded</th>
                  <th>Expiration Date</th>
                </tr>
              </thead>
              <tbody>
                {pointsHistory.map((item) => {
                  const isCredit = item.type === "CREDIT" || item.type === "RESTORE";
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={`badge ${isCredit ? "badge--success" : "badge--warning"}`}>
                          {item.type}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: "700",
                          color: isCredit ? "var(--color-teal)" : "var(--color-primary-dark)",
                        }}
                      >
                        {isCredit ? "+" : "-"}
                        {item.amount.toLocaleString("id-ID")} pts
                      </td>
                      <td>{item.reason}</td>
                      <td>
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          timeZone: "Asia/Jakarta",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        {item.expiresAt ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.85rem",
                              color: "var(--color-muted)",
                            }}
                          >
                            <Calendar size={14} />
                            {new Date(item.expiresAt).toLocaleDateString("en-US", {
                              timeZone: "Asia/Jakarta",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

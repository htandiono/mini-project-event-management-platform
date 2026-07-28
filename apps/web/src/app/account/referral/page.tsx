"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi, type ReferralHistoryItem } from "@/lib/api/user.api";
import { useAuth } from "@/lib/auth-context";
import { Copy, Check, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: referrals, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: userApi.getReferrals,
  });

  const handleCopy = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const list = referrals || [];

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
            paddingBottom: "1.5rem",
            marginBottom: "2rem",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", margin: "0 0 0.4rem 0" }}>
            Referral Program
          </h1>
          <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.92rem" }}>
            Invite friends to Eventure! They get a 10,000 Points coupon (100% discount, max Rp
            10.000) and you earn 10,000 Points (valid for 3 months) when they register.
          </p>
        </div>

        <div
          style={{
            background: "var(--color-canvas)",
            border: "1px dashed var(--color-teal)",
            borderRadius: "var(--radius-md)",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "1rem",
          }}
        >
          <span className="eyebrow" style={{ color: "var(--color-teal)" }}>
            Your Unique Referral Code
          </span>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "2.2rem",
              fontWeight: "700",
              letterSpacing: "0.08em",
              color: "var(--color-ink)",
            }}
          >
            {user?.referralCode || "NONE"}
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={handleCopy}
            style={{ display: "inline-flex", gap: "0.5rem", minWidth: "11rem" }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
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
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}
        >
          <Users size={20} style={{ color: "var(--color-teal)" }} />
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Referral History</h2>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title="No referrals yet"
            description="Share your code with friends to start earning reward points!"
          />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referred Friend</th>
                  <th>Date Joined</th>
                  <th>Reward Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item: ReferralHistoryItem) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: "650" }}>{item.name || item.email}</td>
                    <td>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        timeZone: "Asia/Jakarta",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <span className="badge badge--success">10,000 Points Credited</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

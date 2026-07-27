"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user.api";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, Gift, Share2, ShoppingBag, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountOverviewPage() {
  const { user } = useAuth();

  const { data: pointsHistory, isLoading: isLoadingPoints } = useQuery({
    queryKey: ["pointsHistory"],
    queryFn: userApi.getPointsHistory,
  });

  const { data: coupons, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["coupons"],
    queryFn: userApi.getCoupons,
  });

  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["referrals"],
    queryFn: userApi.getReferrals,
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["userOrders"],
    queryFn: () => userApi.getUserOrders({ limit: 5 }),
  });

  const activePoints = (pointsHistory || []).reduce((acc, item) => {
    if (item.type === "CREDIT" || item.type === "RESTORE") return acc + item.amount;
    if (item.type === "DEBIT" || item.type === "EXPIRE") return acc - item.amount;
    return acc;
  }, 0);

  const activeCouponsCount = (coupons || []).filter(
    (c) => !c.redeemedAt && c.status === "ACTIVE" && new Date(c.expiresAt) > new Date(),
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          background: "linear-gradient(135deg, var(--color-night), #2c3e55)",
          color: "white",
          padding: "2rem",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-soft)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <span
            className="eyebrow"
            style={{ color: "var(--color-gold)", marginBottom: "0.5rem", display: "block" }}
          >
            Customer Dashboard
          </span>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", margin: "0 0 0.5rem 0" }}>
            Hello, {user?.name}!
          </h1>
          <p style={{ color: "#c3cad1", margin: 0, maxWidth: "32rem", fontSize: "0.95rem" }}>
            Welcome to your Eventure dashboard. Manage your tickets, check your points balance, and
            share your referral code to earn rewards.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card__label">Points Balance</span>
            <Sparkles size={20} style={{ color: "var(--color-gold)" }} />
          </div>
          {isLoadingPoints ? (
            <Skeleton width="8rem" height="2.5rem" />
          ) : (
            <span className="stat-card__value">{activePoints.toLocaleString("id-ID")}</span>
          )}
          <Link
            href="/account/points"
            className="stat-card__sub"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            View points history <ArrowRight size={14} />
          </Link>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card__label">Active Coupons</span>
            <Gift size={20} style={{ color: "var(--color-teal)" }} />
          </div>
          {isLoadingCoupons ? (
            <Skeleton width="4rem" height="2.5rem" />
          ) : (
            <span className="stat-card__value">{activeCouponsCount}</span>
          )}
          <Link
            href="/account/coupons"
            className="stat-card__sub"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            View all coupons <ArrowRight size={14} />
          </Link>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card__label">Referral Program</span>
            <Share2 size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          {isLoadingReferrals ? (
            <Skeleton width="6rem" height="2.5rem" />
          ) : (
            <span className="stat-card__value">{referrals?.length || 0}</span>
          )}
          <Link
            href="/account/referral"
            className="stat-card__sub"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            Share code & earn <ArrowRight size={14} />
          </Link>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card__label">My Orders</span>
            <ShoppingBag size={20} style={{ color: "var(--color-muted)" }} />
          </div>
          {isLoadingOrders ? (
            <Skeleton width="5rem" height="2.5rem" />
          ) : (
            <span className="stat-card__value">{ordersData?.length || 0}</span>
          )}
          <Link
            href="/account/orders"
            className="stat-card__sub"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            View all orders <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

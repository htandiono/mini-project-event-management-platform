"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user.api";
import { Sparkles, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

function CustomerPointBadge() {
  const { data: pointsHistory, isLoading } = useQuery({
    queryKey: ["pointsHistory"],
    queryFn: userApi.getPointsHistory,
  });

  if (isLoading) {
    return <Skeleton width="8rem" height="2.2rem" borderRadius="999px" />;
  }

  const activePoints = (pointsHistory || []).reduce((acc, item) => {
    if (item.type === "CREDIT" || item.type === "RESTORE") {
      return acc + item.amount;
    }
    if (item.type === "DEBIT" || item.type === "EXPIRE") {
      return acc - item.amount;
    }
    return acc;
  }, 0);

  return (
    <Link href="/account/points" className="point-badge" title="View points history">
      <Sparkles className="point-badge__icon" size={16} />
      <span>{activePoints.toLocaleString("id-ID")} Points</span>
    </Link>
  );
}

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand" href="/" aria-label="Eventure home">
          <span className="brand__mark" aria-hidden="true">
            E
          </span>
          <span>Eventure</span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/#discover">Discover</Link>
          {user?.role === "ORGANIZER" ? (
            <Link href="/organizer/events">Create event</Link>
          ) : (
            <Link href="/#discover">Browse Events</Link>
          )}
        </nav>

        <div className="site-header__actions" style={{ alignItems: "center" }}>
          {isLoading ? (
            <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
              <Skeleton width="5rem" height="2.5rem" borderRadius="999px" />
              <Skeleton width="7rem" height="2.5rem" borderRadius="999px" />
            </div>
          ) : user ? (
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {user.role === "CUSTOMER" && <CustomerPointBadge />}

              <Link
                className="button button--light"
                style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.88rem" }}
                href={user.role === "ORGANIZER" ? "/organizer/dashboard" : "/account"}
              >
                {user.role === "ORGANIZER" ? (
                  <LayoutDashboard size={16} />
                ) : (
                  <UserIcon size={16} />
                )}
                <span>{user.name || "Dashboard"}</span>
              </Link>

              <button
                type="button"
                className="button button--ghost"
                style={{ padding: "0.5rem", minHeight: "2.5rem" }}
                onClick={() => logout()}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link className="button button--ghost" href="/login">
                Log in
              </Link>
              <Link className="button button--primary" href="/register">
                Join Eventure
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

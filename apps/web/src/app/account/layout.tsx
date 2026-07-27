"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  User,
  KeyRound,
  Share2,
  Gift,
  Sparkles,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="shell dashboard-layout">
        <Skeleton width="100%" height="25rem" />
        <Skeleton width="100%" height="30rem" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { label: "Overview", href: "/account", icon: LayoutDashboard, exact: true },
    { label: "My Orders", href: "/account/orders", icon: ShoppingBag },
    { label: "Profile Settings", href: "/account/profile", icon: User },
    { label: "Change Password", href: "/account/password", icon: KeyRound },
    { label: "Referral Program", href: "/account/referral", icon: Share2 },
    { label: "My Coupons", href: "/account/coupons", icon: Gift },
    { label: "Points History", href: "/account/points", icon: Sparkles },
  ];

  return (
    <div className="shell dashboard-layout">
      <aside className="dashboard-sidebar">
        <div
          style={{
            paddingBottom: "1.25rem",
            marginBottom: "1.25rem",
            borderBottom: "1px solid var(--color-line)",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "50%",
              background: "var(--color-teal)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </h2>
            <span className="badge badge--info" style={{ marginTop: "0.2rem", fontSize: "0.68rem" }}>
              {user.role}
            </span>
          </div>
        </div>

        <nav className="dashboard-nav">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dashboard-nav-item ${isActive ? "dashboard-nav-item--active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--color-line)",
          }}
        >
          <button
            type="button"
            onClick={() => logout()}
            className="dashboard-nav-item"
            style={{
              width: "100%",
              background: "transparent",
              border: "0",
              cursor: "pointer",
              color: "var(--color-primary)",
            }}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}

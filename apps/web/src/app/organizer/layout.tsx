"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  User,
  KeyRound,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
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

  if (user.role !== "ORGANIZER") {
    return (
      <div
        className="shell"
        style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-lg)",
            padding: "3rem",
            textAlign: "center",
            maxWidth: "28rem",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <ShieldAlert
            size={48}
            style={{ color: "var(--color-primary)", margin: "0 auto 1rem auto" }}
          />
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", margin: "0 0 0.5rem 0" }}>
            Organizer Access Only
          </h1>
          <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem 0" }}>
            Your account is registered as a Customer. To host events and access organizer analytics,
            please sign in with an Organizer account.
          </p>
          <Link
            href="/account"
            className="button button--primary"
            style={{ display: "inline-block" }}
          >
            Go to Customer Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/organizer/dashboard", icon: LayoutDashboard, exact: true },
    { label: "My Events", href: "/organizer/events", icon: CalendarDays, exact: true },
    { label: "Order Verifications", href: "/organizer/orders", icon: ClipboardCheck },
    { label: "Analytics & Reports", href: "/organizer/analytics", icon: BarChart3 },
    { label: "Profile Settings", href: "/organizer/profile", icon: User },
    { label: "Change Password", href: "/organizer/password", icon: KeyRound },
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
              background: "linear-gradient(135deg, var(--color-gold), #b37e1a)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || "O"}
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
            <span
              className="badge badge--warning"
              style={{
                marginTop: "0.2rem",
                fontSize: "0.68rem",
                background: "var(--color-gold)",
                color: "white",
              }}
            >
              ORGANIZER
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

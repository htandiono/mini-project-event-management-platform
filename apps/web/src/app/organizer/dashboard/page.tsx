"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CalendarDays, PlusCircle, ClipboardCheck, BarChart3, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard.api";
import { transactionsApi } from "@/lib/api/transactions.api";
import { formatIdr } from "@/lib/currency";

export default function OrganizerDashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["organizer-statistics"],
    queryFn: () => dashboardApi.getStatistics(),
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ["organizer-pending-orders"],
    queryFn: () => transactionsApi.listTransactions({ status: "WAITING_FOR_CONFIRMATION" }),
  });

  const totalEvents = stats?.summary?.totalEvents || 0;
  const pendingCount = pendingOrders?.length || 0;
  const totalAttendees = stats?.summary?.totalAttendees || 0;
  const totalRevenue = stats?.summary?.totalRevenue || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          background: "linear-gradient(135deg, var(--color-night), #3f311c)",
          color: "white",
          padding: "2rem",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-soft)",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(229, 170, 61, 0.3)",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <span
            className="eyebrow"
            style={{ color: "var(--color-gold)", marginBottom: "0.5rem", display: "block" }}
          >
            Organizer Control Center
          </span>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", margin: "0 0 0.5rem 0" }}>
            Welcome, {user?.name}!
          </h1>
          <p style={{ color: "#c3cad1", margin: 0, maxWidth: "34rem", fontSize: "0.95rem" }}>
            Create and publish upcoming events, verify attendee payment proofs, and monitor your
            ticket sales revenue in real-time.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: "4px solid var(--color-gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card__label">Active Events</span>
            <CalendarDays size={20} style={{ color: "var(--color-gold)" }} />
          </div>
          <span className="stat-card__value">{totalEvents}</span>
          <Link
            href="/organizer/events"
            className="stat-card__sub"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "var(--color-gold)",
            }}
          >
            Manage events <ArrowRight size={14} />
          </Link>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid var(--color-teal)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card__label">Pending Verifications</span>
            <ClipboardCheck size={20} style={{ color: "var(--color-teal)" }} />
          </div>
          <span className="stat-card__value">{pendingCount}</span>
          <Link
            href="/organizer/orders"
            className="stat-card__sub"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            Review payment proofs <ArrowRight size={14} />
          </Link>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card__label">Total Tickets Sold</span>
            <BarChart3 size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          <span className="stat-card__value">{totalAttendees}</span>
          <span className="stat-card__sub">Across all events</span>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card__label">Gross Revenue (IDR)</span>
            <span style={{ fontWeight: "700", color: "var(--color-gold)" }}>Rp</span>
          </div>
          <span className="stat-card__value" style={{ fontSize: "1.4rem" }}>
            {formatIdr(totalRevenue)}
          </span>
          <Link
            href="/organizer/analytics"
            className="stat-card__sub"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            View financial charts <ArrowRight size={14} />
          </Link>
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
        <h2 style={{ fontSize: "1.25rem", margin: "0 0 1.5rem 0" }}>Quick Actions</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))",
            gap: "1.5rem",
          }}
        >
          <Link
            href="/organizer/events/new"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1.5rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-canvas)",
              border: "1px solid var(--color-line)",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(229, 170, 61, 0.15)",
                color: "var(--color-gold)",
              }}
            >
              <PlusCircle size={24} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  margin: "0 0 0.35rem 0",
                  color: "var(--color-ink)",
                }}
              >
                Create New Event
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted)" }}>
                Set up dates, ticket tiers, promotional vouchers, and venue locations.
              </p>
            </div>
          </Link>

          <Link
            href="/organizer/orders"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1.5rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-canvas)",
              border: "1px solid var(--color-line)",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(23, 109, 101, 0.15)",
                color: "var(--color-teal)",
              }}
            >
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  margin: "0 0 0.35rem 0",
                  color: "var(--color-ink)",
                }}
              >
                Verify Attendees
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted)" }}>
                Approve or reject uploaded bank transfer receipts from ticket buyers.
              </p>
            </div>
          </Link>

          <Link
            href="/organizer/analytics"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1.5rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-canvas)",
              border: "1px solid var(--color-line)",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(184, 51, 42, 0.15)",
                color: "var(--color-primary)",
              }}
            >
              <BarChart3 size={24} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  margin: "0 0 0.35rem 0",
                  color: "var(--color-ink)",
                }}
              >
                Analytics & Reports
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted)" }}>
                Analyze revenue breakdowns, ticket attendance rates, and event performance.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

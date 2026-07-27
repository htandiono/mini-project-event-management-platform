"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard.api";
import { formatIdr } from "@/lib/currency";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Calendar, Filter, DollarSign, Ticket, Layers, RefreshCw } from "lucide-react";

export default function OrganizerAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const queryParams = React.useMemo(() => {
    if (timeRange === "CUSTOM") {
      return { startDate: startDate || undefined, endDate: endDate || undefined };
    }
    if (timeRange === "YEAR") {
      const start = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
      const end = new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0];
      return { startDate: start, endDate: end };
    }
    if (timeRange === "MONTH") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      return { startDate: start, endDate: end };
    }
    if (timeRange === "DAY") {
      const today = new Date().toISOString().split("T")[0];
      return { startDate: today, endDate: today };
    }
    return undefined;
  }, [timeRange, startDate, endDate]);

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["organizer-analytics", queryParams],
    queryFn: () => dashboardApi.getStatistics(queryParams),
  });

  const summary = stats?.summary || {
    totalRevenue: 0,
    totalAttendees: 0,
    totalEvents: 0,
    averageRating: null,
  };

  const revenueData = stats?.revenueByMonth || [];
  const ticketData = stats?.ticketSalesByMonth || [];
  const categoryData = stats?.eventsByCategory || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", margin: "0 0 0.5rem 0" }}>
            Analytics & Financial Reports
          </h1>
          <p style={{ color: "var(--color-muted)", margin: 0 }}>
            Inspect ticket sales trends, category distribution, and revenue visualizations by year,
            month, and day.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="button"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          padding: "1.25rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-line)",
          display: "flex",
          gap: "1.5rem",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <Filter size={16} style={{ color: "var(--color-muted)" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: "600", marginRight: "0.5rem" }}>
            Filter Timeframe:
          </span>
          {[
            { label: "All Time", value: "ALL" },
            { label: "This Year", value: "YEAR" },
            { label: "This Month", value: "MONTH" },
            { label: "Today", value: "DAY" },
            { label: "Custom Range", value: "CUSTOM" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTimeRange(tab.value)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid",
                borderColor: timeRange === tab.value ? "var(--color-gold)" : "var(--color-line)",
                background: timeRange === tab.value ? "var(--color-gold)" : "var(--color-canvas)",
                color: timeRange === tab.value ? "white" : "var(--color-ink)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: timeRange === tab.value ? "600" : "400",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {timeRange === "CUSTOM" && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Calendar size={16} style={{ color: "var(--color-muted)" }} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
              style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem" }}
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
              style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem" }}
            />
          </div>
        )}
      </div>

      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        <div className="stat-card" style={{ borderTop: "3px solid var(--color-gold)" }}>
          <span
            className="stat-card__label"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <DollarSign size={16} style={{ color: "var(--color-gold)" }} /> Total Revenue
          </span>
          <span className="stat-card__value" style={{ fontSize: "1.5rem" }}>
            {formatIdr(summary.totalRevenue)}
          </span>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid var(--color-teal)" }}>
          <span
            className="stat-card__label"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Ticket size={16} style={{ color: "var(--color-teal)" }} /> Total Tickets Sold
          </span>
          <span className="stat-card__value">{summary.totalAttendees}</span>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid var(--color-primary)" }}>
          <span
            className="stat-card__label"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Layers size={16} style={{ color: "var(--color-primary)" }} /> Total Published Events
          </span>
          <span className="stat-card__value">{summary.totalEvents}</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-muted)" }}>
          Loading visualization charts...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
            gap: "2rem",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.15rem", color: "var(--color-ink)" }}>
              Revenue Over Time (IDR)
            </h3>
            <div style={{ width: "100%", height: 300 }}>
              {revenueData.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-muted)",
                    fontStyle: "italic",
                  }}
                >
                  No revenue recorded for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                    <XAxis dataKey="month" stroke="var(--color-muted)" fontSize={12} />
                    <YAxis stroke="var(--color-muted)" fontSize={12} />
                    <Tooltip
                      formatter={(value: unknown) => [formatIdr(Number(value || 0)), "Revenue"]}
                      contentStyle={{
                        background: "var(--color-surface)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-line)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      name="Revenue (IDR)"
                      fill="var(--color-gold)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.15rem", color: "var(--color-ink)" }}>
              Ticket Volume Over Time
            </h3>
            <div style={{ width: "100%", height: 300 }}>
              {ticketData.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-muted)",
                    fontStyle: "italic",
                  }}
                >
                  No ticket sales recorded for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                    <XAxis dataKey="month" stroke="var(--color-muted)" fontSize={12} />
                    <YAxis stroke="var(--color-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-line)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Tickets Sold"
                      fill="var(--color-teal)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              boxShadow: "var(--shadow-soft)",
              gridColumn: "1 / -1",
            }}
          >
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.15rem", color: "var(--color-ink)" }}>
              Events by Category Distribution
            </h3>
            <div style={{ width: "100%", height: 260 }}>
              {categoryData.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-muted)",
                    fontStyle: "italic",
                  }}
                >
                  No events categorized yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                    <XAxis type="number" stroke="var(--color-muted)" fontSize={12} />
                    <YAxis
                      dataKey="category"
                      type="category"
                      stroke="var(--color-muted)"
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-line)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Event Count"
                      fill="var(--color-primary)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

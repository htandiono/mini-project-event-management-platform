import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardApi } from "@/lib/api/dashboard.api";
import { transactionsApi } from "@/lib/api/transactions.api";

import OrganizerDashboardPage from "./dashboard/page";
import OrganizerLayout from "./layout";

const replace = vi.fn();
const logout = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/organizer/dashboard",
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "organizer-1",
      email: "organizer@example.com",
      name: "Nadia Organizer",
      role: "ORGANIZER",
    },
    isLoading: false,
    logout,
  }),
}));

vi.mock("@/lib/api/dashboard.api", () => ({
  dashboardApi: { getStatistics: vi.fn() },
}));

vi.mock("@/lib/api/transactions.api", () => ({
  transactionsApi: { listTransactions: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(dashboardApi.getStatistics).mockResolvedValue({
    summary: { totalRevenue: 0, totalAttendees: 0, totalEvents: 0, averageRating: null },
    revenueByMonth: [],
    ticketSalesByMonth: [],
    eventsByCategory: [],
  });
  vi.mocked(transactionsApi.listTransactions).mockResolvedValue([]);
});

describe("organizer navigation", () => {
  it("keeps only the working event-management destination in the sidebar", () => {
    render(
      <OrganizerLayout>
        <p>Organizer content</p>
      </OrganizerLayout>,
    );

    expect(screen.queryByRole("link", { name: "Create Event" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Events" })).toHaveAttribute(
      "href",
      "/organizer/events",
    );
  });

  it("routes the dashboard create action to the working event manager", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OrganizerDashboardPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Create New Event" }).closest("a")).toHaveAttribute(
      "href",
      "/organizer/events",
    );
  });
});

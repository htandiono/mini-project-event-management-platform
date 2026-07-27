import type { AttendeeListItem, DashboardQuery, DashboardStatsResponse } from "@eventure/shared";
import { fetchApi } from "./client";

export const dashboardApi = {
  getStatistics: (params?: DashboardQuery) =>
    fetchApi<DashboardStatsResponse>("/dashboard/statistics", { method: "GET", params }),

  getAttendees: (eventId: string, params?: { search?: string; page?: number; limit?: number }) =>
    fetchApi<{ items: AttendeeListItem[]; total: number; page: number; limit: number }>(
      `/dashboard/events/${eventId}/attendees`,
      { method: "GET", params },
    ),
};

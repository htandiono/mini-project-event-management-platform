export interface DashboardSummary {
  totalRevenue: number;
  totalAttendees: number;
  totalEvents: number;
  averageRating: number | null;
}

export interface MonthlyRevenueSeries {
  month: string;
  revenue: number;
}

export interface MonthlyTicketSalesSeries {
  month: string;
  count: number;
}

export interface CategoryDistributionSeries {
  category: string;
  count: number;
}

export interface DashboardStatsResponse {
  summary: DashboardSummary;
  revenueByMonth: MonthlyRevenueSeries[];
  ticketSalesByMonth: MonthlyTicketSalesSeries[];
  eventsByCategory: CategoryDistributionSeries[];
}

const dashboardDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Enter a valid calendar date");

export const dashboardQuerySchema = z
  .object({
    startDate: dashboardDateSchema.optional(),
    endDate: dashboardDateSchema.optional(),
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
    "Start date must be on or before end date",
  );

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
import { z } from "zod";

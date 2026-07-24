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

export interface DashboardQuery {
  startDate?: string;
  endDate?: string;
}

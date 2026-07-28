import { prisma, type Prisma } from "@eventure/database";
import type {
  AttendeeListItem,
  CategoryDistributionSeries,
  DashboardQuery,
  DashboardStatsResponse,
  MonthlyRevenueSeries,
  MonthlyTicketSalesSeries,
} from "@eventure/shared";
import { AppError } from "../lib/app-error.js";

export async function getStatistics(
  organizerId: string,
  query: DashboardQuery,
): Promise<DashboardStatsResponse> {
  const events = await prisma.event.findMany({
    where: { organizerId, deletedAt: null },
    select: { id: true, category: { select: { name: true } } },
  });

  const eventIds = events.map((e) => e.id);

  if (eventIds.length === 0) {
    return {
      summary: {
        totalRevenue: 0,
        totalAttendees: 0,
        totalEvents: 0,
        averageRating: null,
      },
      revenueByMonth: [],
      ticketSalesByMonth: [],
      eventsByCategory: [],
    };
  }

  const dateFilter: Prisma.TransactionWhereInput = {
    eventId: { in: eventIds },
    status: "DONE",
  };

  if (query.startDate || query.endDate) {
    dateFilter.createdAt = {};
    if (query.startDate) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        gte: new Date(`${query.startDate}T00:00:00.000+07:00`),
      };
    }
    if (query.endDate) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        lte: new Date(`${query.endDate}T23:59:59.999+07:00`),
      };
    }
  }

  const revAgg = await prisma.transaction.aggregate({
    where: dateFilter,
    _sum: { total: true },
  });
  const totalRevenue = revAgg._sum.total ?? 0;

  const doneTransactions = await prisma.transaction.findMany({
    where: dateFilter,
    select: {
      id: true,
      total: true,
      createdAt: true,
      items: { select: { quantity: true } },
    },
  });

  let totalAttendees = 0;
  const monthlyMap = new Map<string, { revenue: number; tickets: number }>();

  for (const t of doneTransactions) {
    const month = t.createdAt.toISOString().slice(0, 7);
    const current = monthlyMap.get(month) ?? { revenue: 0, tickets: 0 };
    current.revenue += t.total;

    for (const item of t.items) {
      totalAttendees += item.quantity;
      current.tickets += item.quantity;
    }
    monthlyMap.set(month, current);
  }

  const reviewAgg = await prisma.review.aggregate({
    where: {
      eventId: { in: eventIds },
      deletedAt: null,
    },
    _avg: { rating: true },
  });
  const averageRating = reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null;

  const sortedMonths = Array.from(monthlyMap.keys()).sort();
  const revenueByMonth: MonthlyRevenueSeries[] = sortedMonths.map((m) => ({
    month: m,
    revenue: monthlyMap.get(m)!.revenue,
  }));
  const ticketSalesByMonth: MonthlyTicketSalesSeries[] = sortedMonths.map((m) => ({
    month: m,
    count: monthlyMap.get(m)!.tickets,
  }));

  const categoryMap = new Map<string, number>();
  for (const e of events) {
    const catName = e.category?.name ?? "Uncategorized";
    categoryMap.set(catName, (categoryMap.get(catName) ?? 0) + 1);
  }
  const eventsByCategory: CategoryDistributionSeries[] = Array.from(categoryMap.entries()).map(
    ([category, count]) => ({
      category,
      count,
    }),
  );

  return {
    summary: {
      totalRevenue,
      totalAttendees,
      totalEvents: events.length,
      averageRating,
    },
    revenueByMonth,
    ticketSalesByMonth,
    eventsByCategory,
  };
}

export async function getAttendees(
  organizerId: string,
  eventId: string,
): Promise<AttendeeListItem[]> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
  });

  if (!event) {
    throw new AppError("Event not found or unauthorized", 404);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      eventId,
      status: "DONE",
    },
    include: {
      customer: { select: { name: true, email: true } },
      items: {
        include: {
          ticketType: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const attendees: AttendeeListItem[] = [];
  for (const t of transactions) {
    const ticketNames = t.items.map((i) => i.ticketType.name).join(", ");
    const totalQty = t.items.reduce((sum, i) => sum + i.quantity, 0);
    attendees.push({
      id: t.id,
      invoiceNumber: t.invoiceNumber,
      customerName: t.customer?.name ?? "Unknown",
      customerEmail: t.customer?.email ?? "Unknown",
      ticketTypeName: ticketNames,
      quantity: totalQty,
      totalPaid: t.total,
      isAttended: t.isAttended,
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    });
  }

  return attendees;
}

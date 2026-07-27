// Placeholder for analytics functions (calculateKPIs, getRevenueOverTime, getCategoryAggregations)
import { NormalizedRecord } from "@/types/data";
import { CategoryAggregation, DashboardKPIs, RevenueTimeSeriesPoint } from "@/types/dashboard";

export function calculateKPIs(data: NormalizedRecord[]): DashboardKPIs {
  return { totalRevenue: 0, averageTicket: 0, totalSalesCount: 0 };
}

export function getRevenueOverTime(data: NormalizedRecord[]): RevenueTimeSeriesPoint[] {
  return [];
}

export function getCategoryAggregations(data: NormalizedRecord[]): CategoryAggregation[] {
  return [];
}

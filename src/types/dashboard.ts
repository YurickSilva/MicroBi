export interface DashboardKPIs {
  totalRevenue: number;
  averageTicket: number;
  totalSalesCount: number;
}

export interface RevenueTimeSeriesPoint {
  date: string;
  total: number;
}

export interface CategoryAggregation {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

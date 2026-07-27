import { NormalizedRecord } from "@/types/data";

export interface KPIMetrics {
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
  totalCategories: number;
}

export interface TimeSeriesData {
  date: string;
  total: number;
  salesCount: number;
}

export interface CategoryData {
  category: string;
  total: number;
  percentage: number;
  salesCount: number;
}

/**
 * Calcula métricas gerais (KPIs)
 */
export function calculateKPIs(records: NormalizedRecord[]): KPIMetrics {
  if (!records || records.length === 0) {
    return {
      totalRevenue: 0,
      totalSales: 0,
      averageTicket: 0,
      totalCategories: 0,
    };
  }

  const totalRevenue = records.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalSales = records.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  const categoriesSet = new Set(records.map((r) => r.category || "Outros"));
  const totalCategories = categoriesSet.size;

  return {
    totalRevenue,
    totalSales,
    averageTicket,
    totalCategories,
  };
}

/**
 * Agrupa faturamento por data para o gráfico temporal (Revenue Chart)
 */
export function getRevenueOverTime(records: NormalizedRecord[]): TimeSeriesData[] {
  if (!records || records.length === 0) return [];

  const map = new Map<string, { total: number; salesCount: number }>();

  records.forEach((record) => {
    const dateKey = record.date ? record.date.substring(0, 10) : "Sem Data";
    const current = map.get(dateKey) || { total: 0, salesCount: 0 };

    map.set(dateKey, {
      total: current.total + (record.value || 0),
      salesCount: current.salesCount + 1,
    });
  });

  return Array.from(map.entries())
    .map(([date, data]) => ({
      date,
      total: data.total,
      salesCount: data.salesCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Agrupa faturamento por Categoria para o gráfico por Categoria (Category Chart)
 */
export function getCategoryDistribution(records: NormalizedRecord[]): CategoryData[] {
  if (!records || records.length === 0) return [];

  const totalRevenue = records.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const map = new Map<string, { total: number; salesCount: number }>();

  records.forEach((record) => {
    const cat = record.category || "Geral";
    const current = map.get(cat) || { total: 0, salesCount: 0 };

    map.set(cat, {
      total: current.total + (record.value || 0),
      salesCount: current.salesCount + 1,
    });
  });

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
      salesCount: data.salesCount,
    }))
    .sort((a, b) => b.total - a.total);
}
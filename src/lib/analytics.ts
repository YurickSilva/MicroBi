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

// ─── NOVOS: KPIs adicionais ────────────────────────────────────────────────

export interface BestDayData {
  date: string;
  total: number;
  salesCount: number;
}

/**
 * Encontra o dia com maior faturamento no conjunto de registros.
 */
export function getBestSalesDay(records: NormalizedRecord[]): BestDayData | null {
  const series = getRevenueOverTime(records);
  if (series.length === 0) return null;

  return series.reduce((best, curr) => (curr.total > best.total ? curr : best), series[0]);
}

/**
 * Média de vendas (transações) por dia com atividade no período.
 * Usa apenas dias que tiveram ao menos uma venda (não conta dias "zerados").
 */
export function getAverageSalesPerDay(records: NormalizedRecord[]): number {
  const series = getRevenueOverTime(records);
  if (series.length === 0) return 0;

  const totalSales = series.reduce((acc, day) => acc + day.salesCount, 0);
  return totalSales / series.length;
}

export interface TopConcentration {
  categories: string[];
  percentage: number;
}

/**
 * Calcula quanto as N maiores categorias representam do faturamento total.
 */
export function getTopCategoryConcentration(
  records: NormalizedRecord[],
  topN: number = 3
): TopConcentration {
  const distribution = getCategoryDistribution(records);
  const top = distribution.slice(0, topN);
  const percentage = top.reduce((acc, cat) => acc + cat.percentage, 0);

  return {
    categories: top.map((c) => c.category),
    percentage,
  };
}

export interface GrowthMetrics {
  currentRevenue: number;
  previousRevenue: number;
  growthPercentage: number | null; // null quando não há dados do período anterior para comparar
  direction: "up" | "down" | "flat" | "unknown";
}

/**
 * Compara o faturamento de dois conjuntos de registros (período atual vs. anterior).
 */
export function calculateGrowth(
  currentRecords: NormalizedRecord[],
  previousRecords: NormalizedRecord[]
): GrowthMetrics {
  const currentRevenue = currentRecords.reduce((acc, r) => acc + (r.value || 0), 0);
  const previousRevenue = previousRecords.reduce((acc, r) => acc + (r.value || 0), 0);

  if (previousRevenue === 0) {
    return {
      currentRevenue,
      previousRevenue,
      growthPercentage: null,
      direction: "unknown",
    };
  }

  const growthPercentage = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  const direction = growthPercentage > 0.5 ? "up" : growthPercentage < -0.5 ? "down" : "flat";

  return { currentRevenue, previousRevenue, growthPercentage, direction };
}

/**
 * Dado um intervalo [start, end], retorna o intervalo imediatamente anterior
 * de mesma duração (em dias). Usado para comparação período a período.
 */
export function getPreviousPeriodRange(start: string, end: string): [string, string] {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const spanMs = endDate.getTime() - startDate.getTime();

  const prevEnd = new Date(startDate.getTime() - 86400000); // um dia antes do início atual
  const prevStart = new Date(prevEnd.getTime() - spanMs);

  return [prevStart.toISOString().split("T")[0], prevEnd.toISOString().split("T")[0]];
}

// ─── NOVOS: Dados para os 3 gráficos adicionais ────────────────────────────

export interface DayOfWeekData {
  day: string;
  dayIndex: number; // 0 = Domingo ... 6 = Sábado
  total: number;
  salesCount: number;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/**
 * Agrupa faturamento por dia da semana, revelando padrões cíclicos (ex: picos às sextas).
 */
export function getDayOfWeekDistribution(records: NormalizedRecord[]): DayOfWeekData[] {
  const buckets = DAY_NAMES.map((day, dayIndex) => ({
    day,
    dayIndex,
    total: 0,
    salesCount: 0,
  }));

  records.forEach((record) => {
    if (!record.date) return;
    const dayIndex = new Date(`${record.date}T00:00:00`).getDay();
    buckets[dayIndex].total += record.value || 0;
    buckets[dayIndex].salesCount += 1;
  });

  // Reordena começando na Segunda, terminando no Domingo (convenção de semana comercial)
  return [...buckets.slice(1), buckets[0]];
}

export interface ParetoCategoryData extends CategoryData {
  cumulativePercentage: number;
}

/**
 * Distribuição de categorias com percentual acumulado, para o gráfico de Pareto.
 */
export function getParetoDistribution(records: NormalizedRecord[]): ParetoCategoryData[] {
  const distribution = getCategoryDistribution(records);
  let cumulative = 0;

  return distribution.map((cat) => {
    cumulative += cat.percentage;
    return { ...cat, cumulativePercentage: cumulative };
  });
}

/**
 * Gera uma série diária densa (um ponto por dia do intervalo, preenchendo com 0
 * os dias sem vendas). Usado para alinhar duas séries de períodos diferentes
 * no gráfico comparativo.
 */
export function buildDenseDailySeries(
  records: NormalizedRecord[],
  start: string,
  end: string
): TimeSeriesData[] {
  const sparse = new Map(getRevenueOverTime(records).map((d) => [d.date, d]));

  const result: TimeSeriesData[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (cursor.getTime() <= endDate.getTime()) {
    const dateKey = cursor.toISOString().split("T")[0];
    const existing = sparse.get(dateKey);
    result.push({
      date: dateKey,
      total: existing?.total ?? 0,
      salesCount: existing?.salesCount ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
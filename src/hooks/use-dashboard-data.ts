import { useMemo } from "react";
import { useDataStore } from "@/store/use-data-store";
import { useFilteredRecords } from "@/hooks/use-filtered-records";
import {
  calculateKPIs,
  getRevenueOverTime,
  getCategoryDistribution,
  getBestSalesDay,
  getAverageSalesPerDay,
  getTopCategoryConcentration,
  calculateGrowth,
  getPreviousPeriodRange,
  getDayOfWeekDistribution,
  getParetoDistribution,
  buildDenseDailySeries,
} from "@/lib/analytics";

export function useDashboardData() {
  const records = useDataStore((state) => state.records);
  const fileName = useDataStore((state) => state.fileName);
  const isLoading = useDataStore((state) => state.isLoading);
  const activeFilters = useDataStore((state) => state.activeFilters);
  const dateBounds = useDataStore((state) => state.dateBounds);

  const filteredRecords = useFilteredRecords();

  const kpis = useMemo(() => calculateKPIs(filteredRecords), [filteredRecords]);
  const revenueSeries = useMemo(() => getRevenueOverTime(filteredRecords), [filteredRecords]);
  const categoryDistribution = useMemo(() => getCategoryDistribution(filteredRecords), [filteredRecords]);

  const bestDay = useMemo(() => getBestSalesDay(filteredRecords), [filteredRecords]);
  const avgSalesPerDay = useMemo(() => getAverageSalesPerDay(filteredRecords), [filteredRecords]);
  const topConcentration = useMemo(() => getTopCategoryConcentration(filteredRecords, 3), [filteredRecords]);
  const dayOfWeekDistribution = useMemo(() => getDayOfWeekDistribution(filteredRecords), [filteredRecords]);
  const paretoDistribution = useMemo(() => getParetoDistribution(filteredRecords), [filteredRecords]);

  // Comparação com período anterior — respeita o filtro de categoria, mas usa uma janela
  // de datas anterior à atualmente selecionada (ou ao range total do CSV, se nada filtrado).
  const { growth, comparisonSeries } = useMemo(() => {
    if (!dateBounds) {
      return { growth: null, comparisonSeries: null };
    }

    const [currentStart, currentEnd] = activeFilters.dateRange ?? [dateBounds.min, dateBounds.max];
    const [prevStart, prevEnd] = getPreviousPeriodRange(currentStart, currentEnd);

    const recordsForCategory = activeFilters.category
      ? records.filter((r) => r.category === activeFilters.category)
      : records;

    const previousRecords = recordsForCategory.filter(
      (r) => r.date >= prevStart && r.date <= prevEnd
    );

    const growthResult = calculateGrowth(filteredRecords, previousRecords);

    const currentDense = buildDenseDailySeries(filteredRecords, currentStart, currentEnd);
    const previousDense = buildDenseDailySeries(previousRecords, prevStart, prevEnd);

    const maxLength = Math.max(currentDense.length, previousDense.length);
    const aligned = Array.from({ length: maxLength }, (_, i) => ({
      dayIndex: i + 1,
      currentDate: currentDense[i]?.date ?? null,
      currentTotal: currentDense[i]?.total ?? 0,
      previousDate: previousDense[i]?.date ?? null,
      previousTotal: previousDense[i]?.total ?? 0,
    }));

    return { growth: growthResult, comparisonSeries: aligned };
  }, [filteredRecords, records, activeFilters, dateBounds]);

  return {
    records: filteredRecords,
    totalRecordsCount: records.length,
    fileName,
    isLoading,
    kpis,
    revenueSeries,
    categoryDistribution,
    hasData: records.length > 0,
    hasFilteredResults: filteredRecords.length > 0,

    // Novos KPIs
    bestDay,
    avgSalesPerDay,
    topConcentration,
    growth,

    // Novos gráficos
    dayOfWeekDistribution,
    paretoDistribution,
    comparisonSeries,
  };
}
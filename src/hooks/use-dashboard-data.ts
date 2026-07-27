import { useMemo } from "react";
import { useDataStore } from "@/store/use-data-store";
import {
  calculateKPIs,
  getRevenueOverTime,
  getCategoryDistribution,
} from "@/lib/analytics";

export function useDashboardData() {
  const records = useDataStore((state) => state.records);
  const fileName = useDataStore((state) => state.fileName);
  const isLoading = useDataStore((state) => state.isLoading);

  const kpis = useMemo(() => calculateKPIs(records), [records]);
  const revenueSeries = useMemo(() => getRevenueOverTime(records), [records]);
  const categoryDistribution = useMemo(() => getCategoryDistribution(records), [records]);

  return {
    records,
    fileName,
    isLoading,
    kpis,
    revenueSeries,
    categoryDistribution,
    hasData: records.length > 0,
  };
}
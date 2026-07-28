import { useMemo } from "react";
import { useDataStore } from "@/store/use-data-store";
import { useFilteredRecords } from "@/hooks/use-filtered-records";
import {
  calculateKPIs,
  getRevenueOverTime,
  getCategoryDistribution,
} from "@/lib/analytics";

export function useDashboardData() {
  const records = useDataStore((state) => state.records);
  const fileName = useDataStore((state) => state.fileName);
  const isLoading = useDataStore((state) => state.isLoading);

  const filteredRecords = useFilteredRecords();

  const kpis = useMemo(() => calculateKPIs(filteredRecords), [filteredRecords]);
  const revenueSeries = useMemo(() => getRevenueOverTime(filteredRecords), [filteredRecords]);
  const categoryDistribution = useMemo(() => getCategoryDistribution(filteredRecords), [filteredRecords]);

  return {
    records: filteredRecords,       // usado pela tabela e pela contagem exibida na navbar
    totalRecordsCount: records.length, // total original, útil para mostrar "X de Y registros"
    fileName,
    isLoading,
    kpis,
    revenueSeries,
    categoryDistribution,
    hasData: records.length > 0,       // baseado no total bruto, não no filtrado
    hasFilteredResults: filteredRecords.length > 0, // true mesmo com filtro zerando resultados
  };
}
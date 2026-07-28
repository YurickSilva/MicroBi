import { useMemo } from "react";
import { useDataStore } from "@/store/use-data-store";
import { NormalizedRecord } from "@/types/data";

export function useFilteredRecords(): NormalizedRecord[] {
  const records = useDataStore((s) => s.records);
  const filters = useDataStore((s) => s.activeFilters);

  return useMemo(() => {
    return records.filter((r) => {
      if (filters.category && r.category !== filters.category) return false;

      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        if (r.date < start || r.date > end) return false;
      }

      return true;
    });
  }, [records, filters]);
}
// Placeholder for use-dashboard-data hook
import { useDataStore } from "@/store/use-data-store";

export function useDashboardData() {
  const { records, fileName } = useDataStore();
  const hasData = records.length > 0;

  return {
    records,
    fileName,
    hasData,
  };
}

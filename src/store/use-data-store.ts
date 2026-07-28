import { create } from "zustand";
import { NormalizedRecord } from "@/types/data";

interface ActiveFilters {
  category: string | null;
  dateRange: [string, string] | null; // [YYYY-MM-DD, YYYY-MM-DD]
}

interface DateBounds {
  min: string;
  max: string;
}

interface DataStore {
  records: NormalizedRecord[];
  fileName: string | null;
  isLoading: boolean;
  activeFilters: ActiveFilters;
  dateBounds: DateBounds | null;

  setRecords: (records: NormalizedRecord[], fileName: string) => void;
  clearRecords: () => void;
  setLoading: (loading: boolean) => void;
  setCategoryFilter: (category: string | null) => void;
  setDateRangeFilter: (range: [string, string] | null) => void;
  clearAllFilters: () => void;
}

/**
 * Calcula a menor e maior data válida dentro de um conjunto de registros.
 * Ignora datas vazias/inválidas para não quebrar o filtro.
 */
function calculateDateBounds(records: NormalizedRecord[]): DateBounds | null {
  const validDates = records
    .map((r) => r.date)
    .filter((d) => d && !isNaN(new Date(d).getTime()))
    .sort();

  if (validDates.length === 0) return null;

  return {
    min: validDates[0],
    max: validDates[validDates.length - 1],
  };
}

export const useDataStore = create<DataStore>((set) => ({
  records: [],
  fileName: null,
  isLoading: false,
  activeFilters: {
    category: null,
    dateRange: null,
  },
  dateBounds: null,

  setRecords: (records, fileName) =>
    set({
      records,
      fileName,
      isLoading: false,
      dateBounds: calculateDateBounds(records),
      activeFilters: { category: null, dateRange: null }, // reseta filtros ao carregar novo CSV
    }),

  clearRecords: () =>
    set({
      records: [],
      fileName: null,
      isLoading: false,
      dateBounds: null,
      activeFilters: { category: null, dateRange: null },
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setCategoryFilter: (category) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, category },
    })),

  setDateRangeFilter: (dateRange) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, dateRange },
    })),

  clearAllFilters: () =>
    set({
      activeFilters: { category: null, dateRange: null },
    }),
}));
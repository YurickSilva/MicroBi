import { create } from "zustand";

export interface DataRecord {
  id: string;
  date: string;       // Formato ISO YYYY-MM-DD
  amount: number;     // Valor monetário
  category: string;   // Categoria/Produto
  raw: Record<string, any>;
}

interface DataStore {
  records: DataRecord[];
  fileName: string | null;
  isLoading: boolean;
  setRecords: (records: DataRecord[], fileName: string) => void;
  clearRecords: () => void;
  setLoading: (loading: boolean) => void;
}

export const useDataStore = create<DataStore>((set) => ({
  records: [],
  fileName: null,
  isLoading: false,

  setRecords: (records, fileName) =>
    set({ records, fileName, isLoading: false }),

  clearRecords: () =>
    set({ records: [], fileName: null, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),
}));
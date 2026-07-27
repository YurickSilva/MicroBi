import { create } from "zustand";
import { NormalizedRecord } from "@/types/data";

interface DataStore {
  records: NormalizedRecord[];
  fileName: string | null;
  isLoading: boolean;
  setRecords: (records: NormalizedRecord[], fileName: string) => void;
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
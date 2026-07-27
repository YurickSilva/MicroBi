// Placeholder for Zustand store
import { create } from "zustand";
import { ColumnMapping, NormalizedRecord, RawCSVRow } from "@/types/data";

interface DataStoreState {
  rawRows: RawCSVRow[];
  headers: string[];
  mapping: ColumnMapping | null;
  records: NormalizedRecord[];
  fileName: string | null;
  setRawData: (rows: RawCSVRow[], headers: string[], fileName: string) => void;
  setMappingAndRecords: (mapping: ColumnMapping, records: NormalizedRecord[]) => void;
  reset: () => void;
}

export const useDataStore = create<DataStoreState>((set) => ({
  rawRows: [],
  headers: [],
  mapping: null,
  records: [],
  fileName: null,
  setRawData: (rawRows, headers, fileName) => set({ rawRows, headers, fileName }),
  setMappingAndRecords: (mapping, records) => set({ mapping, records }),
  reset: () => set({ rawRows: [], headers: [], mapping: null, records: [], fileName: null }),
}));

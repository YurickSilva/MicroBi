// Placeholder for CSV parser logic (PapaParse + sanitização + inferência de colunas)
import { ColumnMapping, NormalizedRecord, RawCSVRow } from "@/types/data";

export function inferColumns(headers: string[]): ColumnMapping {
  return { dateKey: "", valueKey: "", categoryKey: "" };
}

export function parseCSVString(csvContent: string): { data: RawCSVRow[]; headers: string[] } {
  return { data: [], headers: [] };
}

export function normalizeRows(rows: RawCSVRow[], mapping: ColumnMapping): NormalizedRecord[] {
  return [];
}

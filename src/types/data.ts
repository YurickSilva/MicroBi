export interface RawCSVRow {
  [key: string]: string | number | undefined;
}

export interface ColumnMapping {
  dateKey: string;
  valueKey: string;
  categoryKey: string;
}

export interface NormalizedRecord {
  id: string;
  date: string; // ISO format string YYYY-MM-DD
  value: number;
  category: string;
  raw: Record<string, unknown>;
}

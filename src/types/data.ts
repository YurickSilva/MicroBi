/**
 * Representa uma linha bruta parseada pelo PapaParse (chave-valor onde chaves são os cabeçalhos do CSV)
 */
export type RawCSVRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Mapeamento de colunas inferido automaticamente ou selecionado pelo usuário
 */
export interface ColumnMapping {
  dateKey: string;
  valueKey: string;
  categoryKey: string;
}

/**
 * Registro individual de venda sanitizado e normalizado
 */
export interface NormalizedRecord {
  id: string;
  date: string; // Formato YYYY-MM-DD
  value: number;
  category: string;
  raw: RawCSVRow;
}

/**
 * Resultado do parsing inicial do CSV
 */
export interface CSVParseResult {
  data: RawCSVRow[];
  headers: string[];
  suggestedMapping: ColumnMapping;
  errors: string[];
}

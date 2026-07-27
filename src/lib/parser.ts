import Papa from "papaparse";
import { ColumnMapping, NormalizedRecord, RawCSVRow, CSVParseResult } from "@/types/data";
import { NormalizedRecordSchema } from "@/schemas/data-record.schema";

const DATE_KEYWORDS = ["data", "date", "created_at", "createdat", "data_venda", "datavenda", "data_venda"];
const VALUE_KEYWORDS = ["valor", "price", "total", "faturamento", "valor_total", "valortotal", "preco", "amount", "valor_venda", "valorvenda"];
const CATEGORY_KEYWORDS = ["categoria", "produto", "type", "category", "produto_nome", "produtoNome", "item", "nome_produto", "nomeproduto"];

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "_");
}

export function inferColumns(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map(normalizeHeader);
  
  let dateKey = "";
  let valueKey = "";
  let categoryKey = "";

  for (let i = 0; i < headers.length; i++) {
    const norm = normalizedHeaders[i];
    
    if (!dateKey && DATE_KEYWORDS.some(k => norm.includes(k))) {
      dateKey = headers[i];
    }
    if (!valueKey && VALUE_KEYWORDS.some(k => norm.includes(k))) {
      valueKey = headers[i];
    }
    if (!categoryKey && CATEGORY_KEYWORDS.some(k => norm.includes(k))) {
      categoryKey = headers[i];
    }
  }

  return { dateKey, valueKey, categoryKey };
}

export function parseCSVString(csvContent: string): { data: RawCSVRow[]; headers: string[] } {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve({
          data: results.data as RawCSVRow[],
          headers: results.meta.fields || [],
        });
      },
      error: (error) => {
        reject(new Error(`Erro ao parsear CSV: ${error.message}`));
      },
    });
  });
}

export async function parseCSVFile(file: File): Promise<{ data: RawCSVRow[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve({
          data: results.data as RawCSVRow[],
          headers: results.meta.fields || [],
        });
      },
      error: (error) => {
        reject(new Error(`Erro ao parsear arquivo: ${error.message}`));
      },
    });
  });
}

function parseDateValue(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  
  const str = String(value).trim();
  
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  
  const brMatch = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  
  const usMatch = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/);
  if (usMatch) {
    const year = parseInt(usMatch[3], 10);
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    return `${fullYear}-${usMatch[1]}-${usMatch[2]}`;
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  return null;
}

function parseNumericValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  
  if (typeof value === "number") return value;
  
  const str = String(value).trim();
  
  const cleaned = str
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

export function normalizeRows(rows: RawCSVRow[], mapping: ColumnMapping): NormalizedRecord[] {
  const normalized: NormalizedRecord[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    const dateRaw = row[mapping.dateKey];
    const valueRaw = row[mapping.valueKey];
    const categoryRaw = row[mapping.categoryKey];

    const date = parseDateValue(dateRaw);
    const value = parseNumericValue(valueRaw);
    const category = categoryRaw ? String(categoryRaw).trim() : "";

    if (!date) {
      errors.push(`Linha ${i + 1}: Data inválida ou ausente na coluna "${mapping.dateKey}"`);
      continue;
    }
    if (value === null) {
      errors.push(`Linha ${i + 1}: Valor inválido ou ausente na coluna "${mapping.valueKey}"`);
      continue;
    }
    if (!category) {
      errors.push(`Linha ${i + 1}: Categoria inválida ou ausente na coluna "${mapping.categoryKey}"`);
      continue;
    }

    const record: NormalizedRecord = {
      id: `${date}-${i}`,
      date,
      value,
      category,
      raw: row,
    };

    const result = NormalizedRecordSchema.safeParse(record);
    if (!result.success) {
      errors.push(`Linha ${i + 1}: ${result.error.errors.map(e => e.message).join(", ")}`);
      continue;
    }

    normalized.push(result.data);
  }

  return normalized;
}

export async function processCSV(
  csvContent: string | File
): Promise<CSVParseResult> {
  let data: RawCSVRow[];
  let headers: string[];

  if (typeof csvContent === "string") {
    const result = await parseCSVString(csvContent);
    data = result.data;
    headers = result.headers;
  } else {
    const result = await parseCSVFile(csvContent);
    data = result.data;
    headers = result.headers;
  }

  const suggestedMapping = inferColumns(headers);
  const errors: string[] = [];

  if (!suggestedMapping.dateKey) errors.push("Não foi possível identificar a coluna de data");
  if (!suggestedMapping.valueKey) errors.push("Não foi possível identificar a coluna de valor");
  if (!suggestedMapping.categoryKey) errors.push("Não foi possível identificar a coluna de categoria");

  return { data, headers, suggestedMapping, errors };
}
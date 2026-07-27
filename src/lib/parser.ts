import Papa from "papaparse";

export interface RawCSVRow {
  [key: string]: any;
}

export interface ParsedCSVResult {
  data: RawCSVRow[];
  headers: string[];
}

/**
 * Processa um arquivo File (.csv) via PapaParse
 */
export function parseCSVFile(file: File): Promise<ParsedCSVResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data = results.data as RawCSVRow[];
        resolve({ data, headers });
      },
      error: (err: Error) => {
        reject(err);
      },
    });
  });
}

/**
 * Processa uma string/conteúdo CSV via PapaParse
 */
export function parseCSVString(csvContent: string): Promise<ParsedCSVResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data = results.data as RawCSVRow[];
        resolve({ data, headers });
      },
      error: (err: Error) => {
        reject(err);
      },
    });
  });
}
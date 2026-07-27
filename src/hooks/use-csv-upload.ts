import { useState } from "react";
import { useDataStore } from "@/store/use-data-store";
import { parseCSVFile, parseCSVString } from "@/lib/parser";
import { NormalizedRecord, RawCSVRow, ColumnMapping } from "@/types/data";
import { NormalizedRecordSchema } from "@/schemas/data-record.schema";

interface UseCsvUploadProps {
  onSuccess?: () => void;
}

/**
 * Resultado da inferência de colunas, incluindo flag de confiança.
 * `isConfident = false` quando alguma coluna caiu no fallback posicional (keys[0/1/2]).
 */
export interface InferenceResult {
  mapping: ColumnMapping;
  isConfident: boolean;
}

/**
 * Infere quais colunas correspondem a data, valor e categoria.
 * Retorna `isConfident: false` se qualquer coluna não foi encontrada por nome semântico
 * e caiu no fallback posicional — isso sinaliza que o ColumnMapper deve aparecer.
 */
export function inferColumns(headers: string[]): InferenceResult {
  // Normaliza header para comparação: remove acentos, minúsculas
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const DATE_TERMS = /^(data|date|created_at|dia|timestamp|dt|order_date)$/;
  const VALUE_TERMS = /^(valor|price|total|faturamento|amount|revenue|receita|preco|preco_total|gross|net|sale_value)$/;
  const CATEGORY_TERMS = /^(categoria|category|produto|product|type|tipo|grupo|group|item|segment)$/;

  const find = (pattern: RegExp) =>
    headers.find((h) => pattern.test(normalize(h)));

  const dateKey = find(DATE_TERMS);
  const valueKey = find(VALUE_TERMS);
  const categoryKey = find(CATEGORY_TERMS);

  // Calcula confiança: toda coluna encontrada semanticamente → confiante
  const isConfident = Boolean(dateKey && valueKey && categoryKey);

  return {
    mapping: {
      dateKey: dateKey ?? headers[0] ?? "",
      valueKey: valueKey ?? headers[1] ?? "",
      categoryKey: categoryKey ?? headers[2] ?? "",
    },
    isConfident,
  };
}

/**
 * Converte string de número no formato brasileiro (ponto = milhar, vírgula = decimal)
 * ou americano (vírgula = milhar, ponto = decimal) para float.
 *
 * Exemplos:
 *   "1.250,50" → 1250.50  (BR)
 *   "R$ 1.250,50" → 1250.50  (BR com símbolo)
 *   "1,250.50" → 1250.50  (US)
 *   "150.00" → 150.00
 *   "150,00" → 150.00  (BR sem milhar)
 */
function parseNumericValue(rawValue: unknown): number {
  if (typeof rawValue === "number") return isNaN(rawValue) ? 0 : rawValue;
  if (typeof rawValue !== "string") return 0;

  // Remove tudo que não seja dígito, vírgula ou ponto
  const stripped = rawValue.replace(/[^\d,.]/g, "");
  if (!stripped) return 0;

  const hasComma = stripped.includes(",");
  const hasDot = stripped.includes(".");

  let normalized: string;

  if (hasComma && hasDot) {
    // Verifica qual vem por último para determinar o separador decimal
    const lastComma = stripped.lastIndexOf(",");
    const lastDot = stripped.lastIndexOf(".");

    if (lastComma > lastDot) {
      // Formato BR: "1.250,50" → remove pontos, troca vírgula por ponto
      normalized = stripped.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato US: "1,250.50" → remove vírgulas
      normalized = stripped.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    // Pode ser "1250,50" (BR decimal) ou "1,250" (US milhar)
    const parts = stripped.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      // Provavelmente decimal BR: "150,50" ou "1250,50"
      normalized = stripped.replace(",", ".");
    } else {
      // Provavelmente milhar US: "1,250" → remover vírgula
      normalized = stripped.replace(/,/g, "");
    }
  } else {
    // Só ponto, assume separador decimal americano/padrão
    normalized = stripped;
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converte uma string de data nos formatos DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
 * para o formato ISO YYYY-MM-DD exigido pelo schema Zod.
 */
function parseDateToISO(rawDate: unknown): string {
  if (!rawDate) return "";
  const s = String(rawDate).trim();

  // Já está no formato ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);

  // Formato DD/MM/YYYY ou DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Formato ISO completo com horário
  const isoDate = new Date(s);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString().substring(0, 10);
  }

  return s; // Retorna o original; o schema Zod vai rejeitar se inválido
}

/**
 * Normaliza linhas brutas do CSV em objetos NormalizedRecord.
 * Valida cada registro com Zod: inválidos são descartados e reportados.
 */
export function normalizeAndValidateRows(
  rawRows: RawCSVRow[],
  mapping: ColumnMapping
): { records: NormalizedRecord[]; rejectedCount: number; errors: string[] } {
  const records: NormalizedRecord[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    const rawDate = row[mapping.dateKey];
    const rawValue = row[mapping.valueKey];
    const rawCategory = row[mapping.categoryKey];

    const candidate = {
      id: `rec-${index}-${Math.random().toString(36).substring(2, 8)}`,
      date: parseDateToISO(rawDate),
      value: parseNumericValue(rawValue),
      category: String(rawCategory ?? "Geral").trim() || "Geral",
      raw: row as Record<string, unknown>,
    };

    const result = NormalizedRecordSchema.safeParse(candidate);

    if (result.success) {
      records.push(result.data as NormalizedRecord);
    } else {
      const issues = result.error.issues.map((i) => i.message).join("; ");
      errors.push(`Linha ${index + 1}: ${issues}`);
    }
  });

  return { records, rejectedCount: errors.length, errors };
}

export function useCsvUpload({ onSuccess }: UseCsvUploadProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Quando `needsMapping = true`, o ColumnMapper deve ser exibido
  const [needsMapping, setNeedsMapping] = useState(false);
  const [pendingRows, setPendingRows] = useState<RawCSVRow[]>([]);
  const [pendingHeaders, setPendingHeaders] = useState<string[]>([]);
  const [pendingFileName, setPendingFileName] = useState<string>("");
  const setRecords = useDataStore((state) => state.setRecords);

  /**
   * Executa a normalização com o mapeamento confirmado (pelo usuário ou por inferência confiante)
   */
  const applyMapping = (
    rows: RawCSVRow[],
    mapping: ColumnMapping,
    fileName: string
  ) => {
    const { records, rejectedCount, errors } = normalizeAndValidateRows(rows, mapping);

    if (records.length === 0) {
      const detail = errors.slice(0, 3).join(" | ");
      throw new Error(
        `Nenhum registro válido encontrado após validação.${detail ? ` Detalhes: ${detail}` : ""}`
      );
    }

    if (rejectedCount > 0) {
      // Continua mas avisa no console — em produção poderia expor no UI
      console.warn(
        `[MicroBi] ${rejectedCount} registro(s) rejeitado(s) pela validação Zod:\n`,
        errors.slice(0, 5).join("\n")
      );
    }

    setRecords(records, fileName);
    onSuccess?.();
  };

  /**
   * Callback chamado pelo ColumnMapper quando o usuário confirma o mapeamento manual
   */
  const onMappingConfirmed = (manualMapping: {
    dateKey: string;
    amountKey: string;
    categoryKey: string;
  }) => {
    setNeedsMapping(false);
    setIsLoading(true);
    setError(null);
    try {
      applyMapping(
        pendingRows,
        {
          dateKey: manualMapping.dateKey,
          valueKey: manualMapping.amountKey,
          categoryKey: manualMapping.categoryKey,
        },
        pendingFileName
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao aplicar mapeamento.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Processa um arquivo CSV carregado pelo usuário via Dropzone
   */
  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setNeedsMapping(false);

    try {
      const result = await parseCSVFile(file);

      if (!result.data || result.data.length === 0) {
        throw new Error("O arquivo CSV está vazio ou não contém dados válidos.");
      }

      const { mapping, isConfident } = inferColumns(result.headers);

      if (!isConfident) {
        // Guarda o estado pendente e solicita mapeamento manual
        setPendingRows(result.data);
        setPendingHeaders(result.headers);
        setPendingFileName(file.name);
        setNeedsMapping(true);
        setIsLoading(false);
        return;
      }

      applyMapping(result.data, mapping, file.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao processar o arquivo.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Carrega os dados do CSV de demonstração em /public/demo/
   */
  const loadDemoData = async () => {
    setIsLoading(true);
    setError(null);
    setNeedsMapping(false);

    try {
      const response = await fetch("/demo/ecommerce-sample.csv");

      if (!response.ok) {
        throw new Error("Não foi possível carregar os dados de demonstração.");
      }

      const csvText = await response.text();
      const result = await parseCSVString(csvText);

      if (!result.data || result.data.length === 0) {
        throw new Error("O arquivo de demonstração está vazio.");
      }

      const { mapping } = inferColumns(result.headers);
      // Demo sempre tem colunas conhecidas — aplicar diretamente
      applyMapping(result.data, mapping, "ecommerce-sample.csv (Demo)");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar o modo de demonstração.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processFile,
    loadDemoData,
    onMappingConfirmed,
    isLoading,
    error,
    needsMapping,
    pendingHeaders,
  };
}
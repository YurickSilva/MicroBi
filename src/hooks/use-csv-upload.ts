import { useState } from "react";
import { useDataStore } from "@/store/use-data-store";
import { parseCSVFile, parseCSVString } from "@/lib/parser";
import { NormalizedRecord, RawCSVRow, ColumnMapping } from "@/types/data";
import { NormalizedRecordSchema } from "@/schemas/data-record.schema";

interface UseCsvUploadProps {
  onSuccess?: () => void;
}

export interface InferenceResult {
  mapping: ColumnMapping;
  isConfident: boolean;
}

// ─── Limites de sanidade ──────────────────────────────────────────────────────

/** Valor máximo aceitável por transação (R$ 1 bilhão). Acima disso → outlier/corrupto */
const MAX_PLAUSIBLE_VALUE = 1_000_000_000;

/** Se mais de X% das linhas forem inválidas, o CSV é considerado inutilizável */
const MAX_INVALID_RATIO = 0.6;

/** Número mínimo de registros válidos necessários para o dashboard fazer sentido */
const MIN_VALID_RECORDS = 3;

// ─── inferColumns ─────────────────────────────────────────────────────────────

/**
 * Infere quais colunas correspondem a data, valor e categoria a partir dos cabeçalhos.
 * Retorna `isConfident: false` se qualquer coluna não foi encontrada por nome semântico
 * e caiu no fallback posicional — isso aciona o ColumnMapper.
 */
export function inferColumns(headers: string[]): InferenceResult {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove underscores e hífens para melhorar a correspondência (ex: "dt_venda" → "dtvenda")
      .replace(/[_\-\s]+/g, "");

  // Termos aceitos para cada coluna. Estratégia: substring/prefixo, não apenas igualdade exata.
  const matchDate = (h: string) =>
    /^(data|date|created|dia|timestamp|quando|dt|order.*date|venda.*data|data.*venda)/.test(
      normalize(h)
    );

  const matchValue = (h: string) =>
    /^(valor|price|total|faturamento|amount|revenue|receita|preco|gross|net|sale|vlr|vl|pago|paid)/.test(
      normalize(h)
    );

  const matchCategory = (h: string) =>
    /^(categoria|category|produto|product|type|tipo|grupo|group|item|segment|sku|classe)/.test(
      normalize(h)
    );

  const dateKey = headers.find((h) => matchDate(h));
  const valueKey = headers.find((h) => matchValue(h));
  const categoryKey = headers.find((h) => matchCategory(h));

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

// ─── parseNumericValue ────────────────────────────────────────────────────────

/**
 * Converte string de número nos formatos BR (ponto=milhar, vírgula=decimal)
 * ou US (vírgula=milhar, ponto=decimal) para float.
 *
 * Retorna `null` quando o campo está vazio ou é texto puro não numérico
 * (ex: "grátis", "abc123") — o chamador decide como tratar.
 *
 * Exemplos:
 *   "R$ 1.250,50" → 1250.50  (BR com símbolo)
 *   "1,250.50"    → 1250.50  (US)
 *   "150,50"      → 150.50   (BR sem milhar)
 *   "150.00"      → 150.00
 *   "grátis"      → null     (texto não numérico)
 *   ""            → null     (campo vazio)
 */
export function parseNumericValue(rawValue: unknown): number | null {
  if (rawValue === null || rawValue === undefined) return null;

  if (typeof rawValue === "number") {
    return isNaN(rawValue) ? null : rawValue;
  }

  if (typeof rawValue !== "string") return null;

  const trimmed = rawValue.trim();
  if (!trimmed) return null; // campo vazio

  // Remove símbolos monetários, espaços, letras isoladas e caracteres não relevantes
  const stripped = trimmed.replace(/[^\d,.-]/g, "");
  if (!stripped || stripped === "." || stripped === ",") return null;

  // Se o que sobrou ainda contiver letras (ex: "abc123" → depois de strip fica "123")
  // precisamos verificar se o original tinha uma parte numérica dominante.
  // Heurística: se >50% dos chars originais (sem espaços) eram não-numéricos, é texto inválido.
  const numericChars = trimmed.replace(/[^0-9]/g, "").length;
  const totalNonSpace = trimmed.replace(/\s/g, "").length;
  if (totalNonSpace > 0 && numericChars / totalNonSpace < 0.5) {
    // Maioria é texto (ex: "grátis", "abc123")
    return null;
  }

  const hasComma = stripped.includes(",");
  const hasDot = stripped.includes(".");
  let normalized: string;

  if (hasComma && hasDot) {
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
    const parts = stripped.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal BR: "150,50"
      normalized = stripped.replace(",", ".");
    } else {
      // Milhar US: "1,250"
      normalized = stripped.replace(/,/g, "");
    }
  } else {
    normalized = stripped;
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

// ─── parseDateToISO ───────────────────────────────────────────────────────────

/**
 * Converte strings de data em vários formatos para ISO YYYY-MM-DD.
 * Retorna `null` para strings claramente inválidas ou datas impossíveis (ex: 31/02, 2026-13-40).
 */
export function parseDateToISO(rawDate: unknown): string | null {
  if (!rawDate) return null;
  const s = String(rawDate).trim();

  // Strings obviamente não-data
  if (!s || /^(n\/a|nd|sem data|null|undefined|-)$/i.test(s)) return null;

  let year: number, month: number, day: number;

  // Formato ISO: YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1]);
    month = parseInt(isoMatch[2]);
    day = parseInt(isoMatch[3]);
  } else {
    // Formato DD/MM/YYYY ou DD-MM-YYYY
    const dmyMatch = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
    if (dmyMatch) {
      day = parseInt(dmyMatch[1]);
      month = parseInt(dmyMatch[2]);
      year = parseInt(dmyMatch[3]);
    } else {
      return null;
    }
  }

  // Validação de faixas básicas
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  // Validação de dias por mês (inclui fevereiro com ano bissexto)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── validateCSVStructure ─────────────────────────────────────────────────────

/**
 * Verifica a estrutura mínima do CSV antes de processar.
 * Retorna um array de erros fatais que impedem o uso do arquivo.
 * Se retornar lista vazia, o arquivo pode ser processado.
 */
export function validateCSVStructure(
  rows: RawCSVRow[],
  headers: string[]
): string[] {
  const fatais: string[] = [];

  if (headers.length === 0) {
    fatais.push("O arquivo não contém cabeçalhos de coluna.");
    return fatais;
  }

  if (headers.length === 1) {
    fatais.push(
      `O arquivo parece usar um separador diferente de vírgula (","). ` +
        `Encontramos apenas 1 coluna chamada "${headers[0]}". ` +
        `Se seu arquivo usa ponto e vírgula (";") como separador, salve-o com separador de vírgula no Excel ` +
        `(Arquivo → Salvar Como → CSV UTF-8) e tente novamente.`
    );
    return fatais;
  }

  if (rows.length === 0) {
    fatais.push("O arquivo contém cabeçalhos, mas não possui nenhuma linha de dados.");
    return fatais;
  }

  return fatais;
}

// ─── normalizeAndValidateRows ─────────────────────────────────────────────────

export interface NormalizeResult {
  records: NormalizedRecord[];
  rejectedCount: number;
  errors: string[];
  /** Erros fatais que tornam o CSV inutilizável (ex: taxa de rejeição muito alta) */
  fatalError: string | null;
}

/**
 * Normaliza linhas brutas do CSV em NormalizedRecords válidos.
 * Aplica validação Zod em cada registro.
 * Retorna `fatalError` quando a qualidade geral é insuficiente para gerar analytics.
 */
export function normalizeAndValidateRows(
  rawRows: RawCSVRow[],
  mapping: ColumnMapping
): NormalizeResult {
  const records: NormalizedRecord[] = [];
  const errors: string[] = [];
  const outlierRows: number[] = [];

  rawRows.forEach((row, index) => {
    const rawDate = row[mapping.dateKey];
    const rawValue = row[mapping.valueKey];
    const rawCategory = row[mapping.categoryKey];
    const lineNum = index + 2; // +2 porque linha 1 é o cabeçalho

    // ── Data ──────────────────────────────────────────────────────────────────
    const parsedDate = parseDateToISO(rawDate);
    if (!parsedDate) {
      errors.push(
        `Linha ${lineNum}: data inválida ou impossível ("${rawDate}") — linha descartada.`
      );
      return;
    }

    // ── Valor ─────────────────────────────────────────────────────────────────
    const parsedValue = parseNumericValue(rawValue);

    if (parsedValue === null) {
      const displayVal = rawValue === "" || rawValue === null || rawValue === undefined
        ? "(campo vazio)"
        : `"${rawValue}"`;
      errors.push(
        `Linha ${lineNum}: valor ${displayVal} não é numérico — linha descartada.`
      );
      return;
    }

    if (parsedValue > MAX_PLAUSIBLE_VALUE) {
      outlierRows.push(lineNum);
      errors.push(
        `Linha ${lineNum}: valor ${parsedValue.toLocaleString("pt-BR")} excede R$ 1 bilhão — provável erro de formatação, linha descartada.`
      );
      return;
    }

    // ── Categoria ─────────────────────────────────────────────────────────────
    const category = String(rawCategory ?? "Geral").trim() || "Geral";

    // ── Schema Zod ────────────────────────────────────────────────────────────
    const candidate = {
      id: `rec-${index}-${Math.random().toString(36).substring(2, 8)}`,
      date: parsedDate,
      value: parsedValue,
      category,
      raw: row as Record<string, unknown>,
    };

    const result = NormalizedRecordSchema.safeParse(candidate);

    if (result.success) {
      records.push(result.data as NormalizedRecord);
    } else {
      const issues = result.error.issues.map((i) => i.message).join("; ");
      errors.push(`Linha ${lineNum} (schema): ${issues} — linha descartada.`);
    }
  });

  // ── Verificação de qualidade geral ────────────────────────────────────────

  const totalLines = rawRows.length;
  const rejectedCount = errors.length;
  const rejectionRate = totalLines > 0 ? rejectedCount / totalLines : 1;

  let fatalError: string | null = null;

  if (records.length === 0) {
    // Tenta dar a mensagem mais útil possível
    const dateErrors = errors.filter((e) => e.includes("data inválida")).length;
    const valueErrors = errors.filter((e) => e.includes("não é numérico") || e.includes("campo vazio")).length;

    if (dateErrors > totalLines * 0.5) {
      fatalError =
        `Nenhum registro válido. ${dateErrors} de ${totalLines} linhas têm datas inválidas ou impossíveis. ` +
        `Verifique o formato da coluna de data (esperado: YYYY-MM-DD ou DD/MM/YYYY).`;
    } else if (valueErrors > totalLines * 0.5) {
      fatalError =
        `Nenhum registro válido. ${valueErrors} de ${totalLines} linhas têm valores não numéricos ou vazios. ` +
        `Verifique se a coluna de valor contém números (ex: 150.50 ou R$ 1.250,00).`;
    } else {
      fatalError =
        `Nenhum registro pôde ser processado. Erros:\n` +
        errors.slice(0, 5).join("\n") +
        (errors.length > 5 ? `\n... e mais ${errors.length - 5} erros.` : "");
    }
  } else if (rejectionRate > MAX_INVALID_RATIO) {
    fatalError =
      `${Math.round(rejectionRate * 100)}% das linhas (${rejectedCount} de ${totalLines}) foram rejeitadas por dados inválidos. ` +
      `O arquivo tem qualidade insuficiente para gerar analytics confiáveis. ` +
      `Revise as colunas de data e valor e tente novamente.`;
  } else if (records.length < MIN_VALID_RECORDS) {
    fatalError =
      `Apenas ${records.length} registro(s) válido(s) encontrado(s). ` +
      `São necessários ao menos ${MIN_VALID_RECORDS} registros para gerar o dashboard.`;
  }

  return { records, rejectedCount, errors, fatalError };
}

// ─── useCsvUpload hook ────────────────────────────────────────────────────────

export function useCsvUpload({ onSuccess }: UseCsvUploadProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [needsMapping, setNeedsMapping] = useState(false);
  const [pendingRows, setPendingRows] = useState<RawCSVRow[]>([]);
  const [pendingHeaders, setPendingHeaders] = useState<string[]>([]);
  const [pendingFileName, setPendingFileName] = useState<string>("");
  const setRecords = useDataStore((state) => state.setRecords);

  /**
   * Executa a normalização com o mapeamento confirmado.
   * Lança erro se o resultado for inutilizável (fatalError).
   * Seta warning se houve rejeições parciais.
   */
  const applyMapping = (
    rows: RawCSVRow[],
    mapping: ColumnMapping,
    fileName: string
  ) => {
    setValidationWarning(null);

    const { records, rejectedCount, fatalError } = normalizeAndValidateRows(rows, mapping);

    if (fatalError) {
      throw new Error(fatalError);
    }

    if (rejectedCount > 0) {
      setValidationWarning(
        `${rejectedCount} linha(s) com dados inválidos foram ignoradas. ` +
          `Processamos ${records.length} registros válidos.`
      );
    }

    setRecords(records, fileName);
    onSuccess?.();
  };

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

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setNeedsMapping(false);
    setValidationWarning(null);

    try {
      const result = await parseCSVFile(file);

      // ── Validação estrutural (erros fatais de formato) ──────────────────────
      const structureErrors = validateCSVStructure(result.data, result.headers);
      if (structureErrors.length > 0) {
        throw new Error(structureErrors[0]);
      }

      const { mapping, isConfident } = inferColumns(result.headers);

      if (!isConfident) {
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

  const loadDemoData = async () => {
    setIsLoading(true);
    setError(null);
    setNeedsMapping(false);
    setValidationWarning(null);

    try {
      const response = await fetch("/demo/ecommerce-sample.csv");

      if (!response.ok) {
        throw new Error("Não foi possível carregar os dados de demonstração.");
      }

      const csvText = await response.text();
      const result = await parseCSVString(csvText);

      const structureErrors = validateCSVStructure(result.data, result.headers);
      if (structureErrors.length > 0) {
        throw new Error(structureErrors[0]);
      }

      const { mapping } = inferColumns(result.headers);
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
    validationWarning,
    needsMapping,
    pendingHeaders,
  };
}
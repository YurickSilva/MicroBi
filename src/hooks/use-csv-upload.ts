import { useState } from "react";
import { useDataStore } from "@/store/use-data-store";
import { parseCSVFile, parseCSVString } from "@/lib/parser";
import { NormalizedRecord, RawCSVRow } from "@/types/data";

interface UseCsvUploadProps {
  onSuccess?: () => void;
}

/**
 * Normaliza linhas brutas do CSV em objetos NormalizedRecord tipados para o Dashboard
 */
function normalizeRawRows(rawRows: RawCSVRow[]): NormalizedRecord[] {
  return rawRows.map((row, index) => {
    const keys = Object.keys(row);

    // Inferência inteligente de colunas essenciais ignorando maiúsculas/minúsculas
    const dateKey = keys.find((k) => /data|date|dia|time/i.test(k)) || keys[0];
    const valueKey = keys.find((k) => /valor|price|amount|total|revenue|preco|quant/i.test(k)) || keys[1];
    const categoryKey = keys.find((k) => /categoria|category|produto|product|tipo|type|grupo/i.test(k)) || keys[2];

    const rawDate = row[dateKey] || new Date().toISOString().split("T")[0];
    const rawValue = row[valueKey];

    // Conversão segura de valores monetários e numéricos (aceita R$, vírgulas e pontos)
    let parsedValue = 0;
    if (typeof rawValue === "number") {
      parsedValue = rawValue;
    } else if (typeof rawValue === "string") {
      const cleaned = rawValue.replace(/[^\d,.-]/g, "").replace(",", ".");
      parsedValue = parseFloat(cleaned) || 0;
    }

    const category = row[categoryKey] || "Geral";

    return {
      id: `record-${index}-${Math.random().toString(36).substring(2, 9)}`,
      date: String(rawDate),
      value: parsedValue,
      category: String(category),
      raw: row,
    };
  });
}

export function useCsvUpload({ onSuccess }: UseCsvUploadProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setRecords = useDataStore((state) => state.setRecords);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await parseCSVFile(file);

      if (!result.data || result.data.length === 0) {
        throw new Error("O arquivo CSV está vazio ou inválido.");
      }

      const normalizedRecords = normalizeRawRows(result.data);
      setRecords(normalizedRecords, file.name);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido ao processar o arquivo.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = async () => {
    setIsLoading(true);
    setError(null);

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

      const normalizedRecords = normalizeRawRows(result.data);
      setRecords(normalizedRecords, "ecommerce-sample.csv (Demo)");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Erro ao carregar o modo de demonstração.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processFile,
    loadDemoData,
    isLoading,
    error,
  };
}
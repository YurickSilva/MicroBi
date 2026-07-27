import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDataStore, DataRecord } from "@/store/use-data-store";
import { parseCSVFile, parseCSVString } from "@/lib/parser";

export function useCsvUpload() {
  const router = useRouter();
  const setRecords = useDataStore((state) => state.setRecords);
  const setLoadingStore = useDataStore((state) => state.setLoading);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Processa arquivo CSV local do usuário
  const processFile = async (file: File) => {
    setIsLoading(true);
    setLoadingStore(true);
    setError(null);

    try {
      const parsed = await parseCSVFile(file);
      
      if (!parsed.data || parsed.data.length === 0) {
        throw new Error("O arquivo CSV está vazio ou não possui registros válidos.");
      }

      setRecords(parsed.data as unknown as DataRecord[], file.name);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao processar o arquivo CSV.");
    } finally {
      setIsLoading(false);
      setLoadingStore(false);
    }
  };

  // Carrega o CSV sintético do Modo Demo
  const processDemoFile = async () => {
    setIsLoading(true);
    setLoadingStore(true);
    setError(null);

    try {
      const response = await fetch("/demo/ecommerce-sample.csv");
      if (!response.ok) {
        throw new Error("Não foi possível carregar o arquivo de demonstração.");
      }

      const csvText = await response.text();
      const parsed = await parseCSVString(csvText);

      if (!parsed.data || parsed.data.length === 0) {
        throw new Error("O arquivo de demonstração está vazio.");
      }

      setRecords(parsed.data as unknown as DataRecord[], "ecommerce-sample.csv");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao carregar os dados de demonstração.");
    } finally {
      setIsLoading(false);
      setLoadingStore(false);
    }
  };

  return {
    processFile,
    processDemoFile,
    isLoading,
    error,
  };
}
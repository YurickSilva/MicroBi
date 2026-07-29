"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Play } from "lucide-react";
import { Dropzone } from "@/components/upload/dropzone";
import { ColumnMapper } from "@/components/upload/column-mapper";
import { HowToUseDialog } from "@/components/upload/how-to-use-dialog";
import { useCsvUpload } from "@/hooks/use-csv-upload";

export default function LandingPage() {
  const router = useRouter();

  const {
    processFile,
    loadDemoData,
    onMappingConfirmed,
    isLoading,
    error,
    validationWarning,
    needsMapping,
    pendingHeaders,
  } = useCsvUpload({
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-8 text-center">

        {/* Header / Hero Section */}
        <div className="space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <BarChart3 className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            MicroBi Financeiro
          </h1>

          <div className="max-w-lg mx-auto space-y-2 px-2">
            <p className="text-base sm:text-lg font-medium text-zinc-300">
              Transforme planilhas em inteligência financeira.
            </p>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Os dados são lidos, exibidos e descartados direto na sua máquina. Sem servidores externos e sem banco de dados seus dados estão seguros.
            </p>
          </div>

          <div className="flex justify-center pt-1">
            <HowToUseDialog />
          </div>
        </div>

        {/*
          Mapeamento manual de colunas — exibido quando a inferência automática
          usou fallback posicional (confiança baixa) em vez de reconhecimento semântico.
        */}
        {needsMapping ? (
          <ColumnMapper
            availableHeaders={pendingHeaders}
            onConfirmMapping={onMappingConfirmed}
          />
        ) : (
          /* Upload Área (Dropzone) — visível enquanto não precisar de mapeamento */
          <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-3xl shadow-xl shadow-black/20">
            <Dropzone
              onFileSelect={processFile}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}

        {/* Banner de aviso parcial — algumas linhas foram descartadas mas o arquivo foi aceito */}
        {validationWarning && !error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-left">
            <span className="text-amber-400 text-base leading-none mt-0.5">⚠</span>
            <p className="text-xs text-amber-300/90 leading-relaxed">{validationWarning}</p>
          </div>
        )}

        {/* Botão de Modo Demo — oculto durante mapeamento manual */}
        {!needsMapping && (
          <div className="flex flex-col items-center gap-3 pt-4">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              Ou teste sem arquivos
            </span>
            <button
              onClick={loadDemoData}
              disabled={isLoading}
              className="py-2.5 px-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>{isLoading ? "Carregando Demo..." : "Carregar Dados de Exemplo"}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
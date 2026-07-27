"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Play } from "lucide-react";
import { Dropzone } from "@/components/upload/dropzone";
import { useCsvUpload } from "@/hooks/use-csv-upload";

export default function LandingPage() {
  const router = useRouter();
  
  // O hook gerencia o estado de loading, erros e injeta os dados no Zustand
  const { processFile, loadDemoData, isLoading, error } = useCsvUpload({
    onSuccess: () => {
      // Redireciona para o dashboard assim que o CSV for parseado com sucesso
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
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
            MicroBi Analytics
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
            Transforme planilhas em inteligência executiva instantaneamente.
            Processamento 100% no navegador, sem envio de dados para servidores.
          </p>
        </div>

        {/* Upload Área (Dropzone) */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-3xl shadow-xl shadow-black/20">
          <Dropzone
            onFileSelect={processFile}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Botão de Modo Demo */}
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

      </div>
    </div>
  );
}
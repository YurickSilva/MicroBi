"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Erro de Processamento", message, onRetry }: ErrorStateProps) {
  return (
    <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/50 text-center max-w-md mx-auto flex flex-col items-center gap-4 my-8">
      <div className="p-3 bg-red-900/40 rounded-xl text-red-400">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div>
        <h3 className="text-base font-semibold text-red-200">{title}</h3>
        <p className="text-xs text-red-300/80 mt-1">
          {message || "Ocorreu um problema ao carregar ou processar os dados do arquivo CSV."}
        </p>
      </div>

      <div className="flex items-center gap-3 mt-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-red-900/50 hover:bg-red-800/60 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </button>
        )}
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Upload</span>
        </Link>
      </div>
    </div>
  );
}
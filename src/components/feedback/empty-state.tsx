import React from "react";
import Link from "next/link";
import { FileSpreadsheet, Upload } from "lucide-react";

export function EmptyState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-400 mb-4">
        <FileSpreadsheet className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-semibold text-zinc-200">
        Nenhum dado carregado no momento
      </h3>
      <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6">
        Para visualizar o dashboard, faça o upload do seu CSV ou utilize o modo de demonstração.
      </p>

      <Link
        href="/"
        className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
      >
        <Upload className="w-4 h-4" />
        <span>Ir para a Tela de Upload</span>
      </Link>
    </div>
  );
}
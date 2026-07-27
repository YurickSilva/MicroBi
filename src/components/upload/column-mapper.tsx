"use client";

import React, { useState } from "react";
import { Columns, ArrowRight } from "lucide-react";

interface ColumnMapperProps {
  availableHeaders: string[];
  onConfirmMapping: (mapping: { dateKey: string; amountKey: string; categoryKey: string }) => void;
}

export function ColumnMapper({ availableHeaders, onConfirmMapping }: ColumnMapperProps) {
  const [dateKey, setDateKey] = useState<string>(availableHeaders[0] || "");
  const [amountKey, setAmountKey] = useState<string>(availableHeaders[1] || "");
  const [categoryKey, setCategoryKey] = useState<string>(availableHeaders[2] || "");

  const handleConfirm = () => {
    onConfirmMapping({ dateKey, amountKey, categoryKey });
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-5">
      <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
          <Columns className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Mapeamento de Colunas</h3>
          <p className="text-xs text-zinc-400">Associe os campos do seu CSV com a estrutura do dashboard</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Coluna de Data <span className="text-emerald-400">*</span>
          </label>
          <select
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            {availableHeaders.map((header) => (
              <option key={`date-${header}`} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Coluna de Valor / Receita <span className="text-emerald-400">*</span>
          </label>
          <select
            value={amountKey}
            onChange={(e) => setAmountKey(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            {availableHeaders.map((header) => (
              <option key={`amount-${header}`} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Coluna de Categoria / Produto
          </label>
          <select
            value={categoryKey}
            onChange={(e) => setCategoryKey(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Não Mapeado / Padrão Geral --</option>
            {availableHeaders.map((header) => (
              <option key={`cat-${header}`} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
      >
        <span>Confirmar e Processar</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
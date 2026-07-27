"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { NormalizedRecord } from "@/types/data";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface DataTableProps {
  records: NormalizedRecord[];
}

export function DataTable({ records }: DataTableProps) {
  const [search, setSearch] = useState("");

  const filtered = records.filter((r) => {
    const term = search.toLowerCase();
    const catMatch = r.category?.toLowerCase().includes(term);
    const dateMatch = r.date?.includes(term);
    return catMatch || dateMatch;
  });

  return (
    <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">
            Registros Consolidados
          </h3>
          <p className="text-xs text-zinc-400">
            Exibindo {filtered.length} de {records.length} transações
          </p>
        </div>

        {/* Input de Busca */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por categoria ou data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800/60">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800/80 uppercase font-mono text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Data</th>
              <th className="py-2.5 px-4">Categoria</th>
              <th className="py-2.5 px-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {filtered.slice(0, 100).map((record) => (
              <tr key={record.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-2.5 px-4 font-mono text-zinc-400">
                  {formatDate(record.date)}
                </td>
                <td className="py-2.5 px-4 font-medium text-zinc-200">
                  {record.category}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">
                  {formatCurrency(record.value)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-zinc-500">
                  Nenhum registro encontrado para essa busca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
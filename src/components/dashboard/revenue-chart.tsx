"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TimeSeriesData } from "@/lib/analytics";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useDataStore } from "@/store/use-data-store";
import { X } from "lucide-react";

interface RevenueChartProps {
  data: TimeSeriesData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const dateRange = useDataStore((s) => s.activeFilters.dateRange);
  const setDateRangeFilter = useDataStore((s) => s.setDateRangeFilter);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-500">
        Sem dados temporais disponíveis.
      </div>
    );
  }

  // Considera "dia único selecionado" quando o range ativo cobre exatamente 1 dia
  const selectedDay =
    dateRange && dateRange[0] === dateRange[1] ? dateRange[0] : null;

  function handleChartClick(state: any) {
    const clickedDate = state?.activeLabel as string | undefined;
    if (!clickedDate) return;

    if (selectedDay === clickedDate) {
      setDateRangeFilter(null); // clicar de novo no mesmo dia limpa o filtro
    } else {
      setDateRangeFilter([clickedDate, clickedDate]);
    }
  }

  return (
    <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-zinc-200">
          Faturamento ao Longo do Tempo
        </h3>
        {selectedDay && (
          <button
            onClick={() => setDateRangeFilter(null)}
            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 transition-colors"
          >
            {formatDate(selectedDay)}
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-400 mb-6">
        {selectedDay
          ? "Clique novamente no ponto para limpar o filtro"
          : "Evolução diária das vendas — clique em um ponto para filtrar o dia"}
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={handleChartClick}
            style={{ cursor: "pointer" }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `R$ ${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as TimeSeriesData;
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs">
                      <p className="font-semibold text-zinc-200 mb-1">
                        Data: {formatDate(item.date)}
                      </p>
                      <p className="text-emerald-400 font-medium">
                        Faturamento: {formatCurrency(item.total)}
                      </p>
                      <p className="text-zinc-400">
                        Vendas: {item.salesCount}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
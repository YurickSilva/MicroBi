"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { ParetoCategoryData } from "@/lib/analytics";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { useDataStore } from "@/store/use-data-store";
import { X } from "lucide-react";

interface ParetoChartProps {
  data: ParetoCategoryData[];
}

export function ParetoChart({ data }: ParetoChartProps) {
  const activeCategory = useDataStore((s) => s.activeFilters.category);
  const setCategoryFilter = useDataStore((s) => s.setCategoryFilter);

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-zinc-500">
        Sem categorias disponíveis.
      </div>
    );
  }

  const top = data.slice(0, 8);

  function handleBarClick(category: string) {
    setCategoryFilter(activeCategory === category ? null : category);
  }

  return (
    <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-zinc-200">Concentração de Receita (Pareto)</h3>
        {activeCategory && (
          <button
            onClick={() => setCategoryFilter(null)}
            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 transition-colors"
          >
            {activeCategory}
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-400 mb-6">Faturamento por categoria e % acumulado</p>

      <div className="h-56 w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={top} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="category"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              yAxisId="left"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(v)}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ParetoCategoryData;
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs">
                      <p className="font-semibold text-zinc-200 mb-1">{item.category}</p>
                      <p className="text-emerald-400">{formatCurrency(item.total)}</p>
                      <p className="text-zinc-400">Acumulado: {formatPercent(item.cumulativePercentage)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar yAxisId="left" dataKey="total" radius={[4, 4, 0, 0]} cursor="pointer">
              {top.map((entry, index) => {
                const isDimmed = activeCategory !== null && activeCategory !== entry.category;
                return (
                  <Cell
                    key={index}
                    fill="#10b981"
                    fillOpacity={isDimmed ? 0.3 : 1}
                    onClick={() => handleBarClick(entry.category)}
                  />
                );
              })}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercentage"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: "#f59e0b" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
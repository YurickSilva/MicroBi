"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { CategoryData } from "@/lib/analytics";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { useDataStore } from "@/store/use-data-store";
import { X } from "lucide-react";

interface CategoryChartProps {
  data: CategoryData[];
}

const COLORS = ["#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#6366f1", "#8b5cf6"];

export function CategoryChart({ data }: CategoryChartProps) {
  const activeCategory = useDataStore((s) => s.activeFilters.category);
  const setCategoryFilter = useDataStore((s) => s.setCategoryFilter);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-500">
        Sem categorias disponíveis.
      </div>
    );
  }

  const topCategories = data.slice(0, 6);

  function handleBarClick(payload: CategoryData) {
    setCategoryFilter(activeCategory === payload.category ? null : payload.category);
  }

  return (
    <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-zinc-200">
          Distribuição por Categoria
        </h3>
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
      <p className="text-xs text-zinc-400 mb-6">
        {activeCategory
          ? "Clique novamente na barra para limpar o filtro"
          : "Top categorias por receita gerada — clique para filtrar"}
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topCategories}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="category"
              type="category"
              stroke="#a1a1aa"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as CategoryData;
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs">
                      <p className="font-semibold text-zinc-200 mb-1">
                        {item.category}
                      </p>
                      <p className="text-emerald-400 font-medium">
                        Receita: {formatCurrency(item.total)}
                      </p>
                      <p className="text-zinc-400">
                        Representatividade: {formatPercent(item.percentage)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} cursor="pointer">
              {topCategories.map((entry, index) => {
                const isDimmed = activeCategory !== null && activeCategory !== entry.category;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={isDimmed ? 0.3 : 1}
                    onClick={() => handleBarClick(entry)}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
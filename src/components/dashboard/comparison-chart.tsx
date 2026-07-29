"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface ComparisonPoint {
  dayIndex: number;
  currentDate: string | null;
  currentTotal: number;
  previousDate: string | null;
  previousTotal: number;
}

interface ComparisonChartProps {
  data: ComparisonPoint[] | null;
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-zinc-500">
        Dados insuficientes para comparar com o período anterior.
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Comparativo com Período Anterior</h3>
      <p className="text-xs text-zinc-400 mb-6">Faturamento alinhado por dia relativo do período</p>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="dayIndex"
              tickFormatter={(d: number) => `Dia ${d}`}
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
                  const item = payload[0].payload as ComparisonPoint;
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                      <p className="text-emerald-400 font-medium">
                        Atual{item.currentDate ? ` (${formatDate(item.currentDate)})` : ""}:{" "}
                        {formatCurrency(item.currentTotal)}
                      </p>
                      <p className="text-zinc-400">
                        Anterior{item.previousDate ? ` (${formatDate(item.previousDate)})` : ""}:{" "}
                        {formatCurrency(item.previousTotal)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value) => (value === "currentTotal" ? "Atual" : "Anterior")}
            />
            <Line
              type="monotone"
              dataKey="currentTotal"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="previousTotal"
              stroke="#71717a"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
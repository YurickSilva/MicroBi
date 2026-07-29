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
import { DayOfWeekData } from "@/lib/analytics";
import { formatCurrency } from "@/lib/formatters";

interface DayOfWeekChartProps {
  data: DayOfWeekData[];
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  if (!data || data.every((d) => d.salesCount === 0)) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-zinc-500">
        Sem dados suficientes para identificar padrão semanal.
      </div>
    );
  }

  const peak = data.reduce((best, curr) => (curr.total > best.total ? curr : best), data[0]);

  return (
    <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Padrão por Dia da Semana</h3>
      <p className="text-xs text-zinc-400 mb-6">
        Pico de vendas: <span className="text-emerald-400">{peak.day}</span>
      </p>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(d: string) => d.slice(0, 3)}
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DayOfWeekData;
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs">
                      <p className="font-semibold text-zinc-200 mb-1">{item.day}</p>
                      <p className="text-emerald-400">{formatCurrency(item.total)}</p>
                      <p className="text-zinc-400">{item.salesCount} vendas</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.dayIndex === peak.dayIndex ? "#10b981" : "#3f3f46"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
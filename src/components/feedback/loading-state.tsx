import React from "react";

export function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-zinc-900/80 border border-zinc-800/80" />
        ))}
      </div>

      {/* Skeleton Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl bg-zinc-900/80 border border-zinc-800/80" />
        <div className="h-80 rounded-xl bg-zinc-900/80 border border-zinc-800/80" />
      </div>

      {/* Skeleton Tabela */}
      <div className="h-64 rounded-xl bg-zinc-900/80 border border-zinc-800/80" />
    </div>
  );
}
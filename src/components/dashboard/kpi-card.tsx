import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
}

export function KPICard({ title, value, description, icon: Icon }: KPICardProps) {
  return (
    <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-emerald-400">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-zinc-100 tracking-tight">
          {value}
        </div>
        {description && (
          <p className="text-xs text-zinc-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
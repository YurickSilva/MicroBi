"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  Layers, 
  Download, 
  ArrowLeft, 
  BarChart3,
  RefreshCw
} from "lucide-react";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDataStore } from "@/store/use-data-store";
import { KPICard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ReportPDF } from "@/components/pdf/report-pdf";
import { formatCurrency, formatNumber } from "@/lib/formatters";

export default function DashboardPage() {
  const { records, fileName, isLoading, kpis, revenueSeries, categoryDistribution, hasData } = useDashboardData();
  const clearRecords = useDataStore((state) => state.clearRecords);

  // Evita inconsistência de SSR/Hydration com o @react-pdf/renderer
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 sm:p-10">
        <LoadingState />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 sm:p-10 flex items-center justify-center">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navbar Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={clearRecords}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Trocar de arquivo"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Dashboard Executivo
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Fonte: <span className="text-zinc-200 font-mono">{fileName}</span> ({records.length} registros)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              onClick={clearRecords}
              className="py-2 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Novo Upload</span>
            </Link>

            {/* Exportar PDF no Client */}
            {isClient && (
              <PDFDownloadLink
                document={<ReportPDF fileName={fileName || "CSV"} kpis={kpis} categories={categoryDistribution} />}
                fileName={`Relatorio-MicroBi-${fileName?.replace(".csv", "") || "export"}.pdf`}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
              >
                {({ loading }) => (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{loading ? "Gerando PDF..." : "Baixar Relatório PDF"}</span>
                  </>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </div>

        {/* Métricas Principais (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Faturamento Total"
            value={formatCurrency(kpis.totalRevenue)}
            description="Soma consolidada dos valores"
            icon={DollarSign}
          />
          <KPICard
            title="Total de Vendas"
            value={formatNumber(kpis.totalSales)}
            description="Quantidade de registros válidos"
            icon={ShoppingBag}
          />
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(kpis.averageTicket)}
            description="Receita média por transação"
            icon={Receipt}
          />
          <KPICard
            title="Categorias"
            value={formatNumber(kpis.totalCategories)}
            description="Categorias únicas identificadas"
            icon={Layers}
          />
        </div>

        {/* Gráficos Interativos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={revenueSeries} />
          <CategoryChart data={categoryDistribution} />
        </div>

        {/* Tabela de Transações */}
        <DataTable records={records} />
      </div>
    </div>
  );
}
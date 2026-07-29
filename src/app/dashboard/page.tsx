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
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarCheck,
  Activity,
  PieChart,
} from "lucide-react";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDataStore } from "@/store/use-data-store";
import { KPICard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { DataTable } from "@/components/dashboard/data-table";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { DayOfWeekChart } from "@/components/dashboard/day-of-week-chart";
import { ParetoChart } from "@/components/dashboard/pareto-chart";
import { ComparisonChart } from "@/components/dashboard/comparison-chart";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ReportPDF } from "@/components/pdf/report-pdf";
import { formatCurrency, formatNumber, formatDate, formatPercent } from "@/lib/formatters";

export default function DashboardPage() {
  const {
    records,
    totalRecordsCount,
    fileName,
    isLoading,
    kpis,
    revenueSeries,
    categoryDistribution,
    hasData,
    hasFilteredResults,
    bestDay,
    avgSalesPerDay,
    topConcentration,
    growth,
    dayOfWeekDistribution,
    paretoDistribution,
    comparisonSeries,
  } = useDashboardData();

  const clearRecords = useDataStore((state) => state.clearRecords);

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

  const growthIcon =
    growth?.direction === "up" ? TrendingUp : growth?.direction === "down" ? TrendingDown : Minus;

  const growthValue =
    growth?.growthPercentage === null || growth?.growthPercentage === undefined
      ? "—"
      : `${growth.growthPercentage > 0 ? "+" : ""}${growth.growthPercentage.toFixed(1)}%`;

  const growthDescription =
    growth?.direction === "unknown"
      ? "Sem dados do período anterior"
      : "vs. período anterior equivalente";

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
                Fonte: <span className="text-zinc-200 font-mono">{fileName}</span>{" "}
                ({records.length} de {totalRecordsCount} registros)
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

            {isClient && (
              <PDFDownloadLink
                document={
                  <ReportPDF
                    fileName={fileName || "CSV"}
                    kpis={kpis}
                    categories={categoryDistribution}
                    growth={growth}
                    bestDay={bestDay}
                    avgSalesPerDay={avgSalesPerDay}
                    topConcentration={topConcentration}
                    dayOfWeekDistribution={dayOfWeekDistribution}
                  />
                }
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

        {/* Filtro de Período */}
        <DateRangeFilter />

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

        {/* KPIs Avançados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Crescimento"
            value={growthValue}
            description={growthDescription}
            icon={growthIcon}
          />
          <KPICard
            title="Melhor Dia"
            value={bestDay ? formatDate(bestDay.date) : "—"}
            description={bestDay ? `${formatCurrency(bestDay.total)} em vendas` : "Sem dados"}
            icon={CalendarCheck}
          />
          <KPICard
            title="Vendas / Dia"
            value={avgSalesPerDay.toFixed(1)}
            description="Média de transações por dia ativo"
            icon={Activity}
          />
          <KPICard
            title="Concentração Top 3"
            value={formatPercent(topConcentration.percentage)}
            description={
              topConcentration.categories.length > 0
                ? topConcentration.categories.join(", ")
                : "Sem categorias"
            }
            icon={PieChart}
          />
        </div>

        {!hasFilteredResults && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center justify-center">
            <p className="text-sm text-zinc-400">
              Nenhum registro encontrado para o período selecionado. Tente ajustar o filtro de data acima.
            </p>
          </div>
        )}

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={revenueSeries} />
          <CategoryChart data={categoryDistribution} />
        </div>

        
        <div className="pt-2">
          {/* Análises Avançadas 
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-zinc-800/80" />
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Análises Avançadas
            </h2>
            <div className="h-px flex-1 bg-zinc-800/80" />
          </div>
          */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DayOfWeekChart data={dayOfWeekDistribution} />
            <ParetoChart data={paretoDistribution} />
          </div>

          <div className="grid grid-cols-1 gap-6 mt-6">
            <ComparisonChart data={comparisonSeries} />
          </div>
        </div>

        {/* Tabela de Transações */}
        <DataTable records={records} />
      </div>
    </div>
  );
}
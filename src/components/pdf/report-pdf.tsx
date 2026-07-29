import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { KPIMetrics, CategoryData, GrowthMetrics, BestDayData, TopConcentration, DayOfWeekData } from "@/lib/analytics";
import { formatCurrency, formatPercent, formatDate } from "@/lib/formatters";

const styles = StyleSheet.create({
  page: {
    padding: 35,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    borderBottomStyle: "solid",
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#09090b",
  },
  subtitle: {
    fontSize: 10,
    color: "#71717a",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#09090b",
    marginTop: 15,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f4f4f5",
    borderRadius: 6,
  },
  kpiLabel: {
    fontSize: 8,
    color: "#71717a",
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#09090b",
    marginTop: 4,
  },
  kpiSubValue: {
    fontSize: 7,
    color: "#a1a1aa",
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#18181b",
    padding: 6,
    borderRadius: 4,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    borderBottomStyle: "solid",
    padding: 6,
  },
  tableCell: {
    fontSize: 9,
    color: "#27272a",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 15,
  },
  twoColumnHalf: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 35,
    right: 35,
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    borderTopStyle: "solid",
    paddingTop: 8,
  },
});

interface ReportPDFProps {
  fileName: string;
  kpis: KPIMetrics;
  categories: CategoryData[];
  growth?: GrowthMetrics | null;
  bestDay?: BestDayData | null;
  avgSalesPerDay?: number;
  topConcentration?: TopConcentration;
  dayOfWeekDistribution?: DayOfWeekData[];
}

export function ReportPDF({
  fileName,
  kpis,
  categories,
  growth,
  bestDay,
  avgSalesPerDay,
  topConcentration,
  dayOfWeekDistribution,
}: ReportPDFProps) {
  const growthLabel =
    growth && growth.growthPercentage !== null
      ? `${growth.growthPercentage > 0 ? "+" : ""}${growth.growthPercentage.toFixed(1)}%`
      : "—";

  const growthSubLabel =
    growth && growth.growthPercentage !== null
      ? "vs. período anterior"
      : "sem dados anteriores";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório Executivo MicroBi</Text>
          <Text style={styles.subtitle}>
            Fonte de dados: {fileName || "CSV Importado"} • Gerado via Web Client
          </Text>
        </View>

        {/* Resumo de KPIs — Principais */}
        <Text style={styles.sectionTitle}>Métricas Principais</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Faturamento Total</Text>
            <Text style={styles.kpiValue}>{formatCurrency(kpis.totalRevenue)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total de Vendas</Text>
            <Text style={styles.kpiValue}>{kpis.totalSales}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ticket Médio</Text>
            <Text style={styles.kpiValue}>{formatCurrency(kpis.averageTicket)}</Text>
          </View>
        </View>

        {/* Resumo de KPIs — Avançados */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Crescimento</Text>
            <Text style={styles.kpiValue}>{growthLabel}</Text>
            <Text style={styles.kpiSubValue}>{growthSubLabel}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Melhor Dia</Text>
            <Text style={styles.kpiValue}>{bestDay ? formatDate(bestDay.date) : "—"}</Text>
            <Text style={styles.kpiSubValue}>
              {bestDay ? formatCurrency(bestDay.total) : "sem dados"}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Vendas / Dia</Text>
            <Text style={styles.kpiValue}>{(avgSalesPerDay ?? 0).toFixed(1)}</Text>
            <Text style={styles.kpiSubValue}>média de transações</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Concentração Top 3</Text>
            <Text style={styles.kpiValue}>
              {formatPercent(topConcentration?.percentage ?? 0)}
            </Text>
            <Text style={styles.kpiSubValue}>
              {topConcentration?.categories.join(", ") || "sem dados"}
            </Text>
          </View>
        </View>

        <View style={styles.twoColumnRow}>
          {/* Tabela de Categorias */}
          <View style={styles.twoColumnHalf}>
            <Text style={styles.sectionTitle}>Desempenho por Categoria</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Categoria</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>
                  Receita
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>
                  Share
                </Text>
              </View>

              {categories.slice(0, 8).map((cat, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "50%" }]}>{cat.category}</Text>
                  <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                    {formatCurrency(cat.total)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>
                    {formatPercent(cat.percentage)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tabela de Padrão Semanal */}
          {dayOfWeekDistribution && dayOfWeekDistribution.length > 0 && (
            <View style={styles.twoColumnHalf}>
              <Text style={styles.sectionTitle}>Padrão Semanal</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Dia</Text>
                  <Text style={[styles.tableHeaderCell, { width: "50%", textAlign: "right" }]}>
                    Receita
                  </Text>
                </View>

                {dayOfWeekDistribution.map((d, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: "50%" }]}>{d.day}</Text>
                    <Text style={[styles.tableCell, { width: "50%", textAlign: "right" }]}>
                      {formatCurrency(d.total)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Rodapé */}
        <Text style={styles.footer}>
          MicroBi Analytics • Processamento Estático e Privado
        </Text>
      </Page>
    </Document>
  );
}
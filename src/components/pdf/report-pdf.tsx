import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { KPIMetrics, CategoryData } from "@/lib/analytics";
import { formatCurrency, formatPercent } from "@/lib/formatters";

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
    marginBottom: 15,
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
}

export function ReportPDF({ fileName, kpis, categories }: ReportPDFProps) {
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

        {/* Resumo de KPIs */}
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

        {/* Tabela de Categorias */}
        <Text style={styles.sectionTitle}>Desempenho por Categoria</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Categoria</Text>
            <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>Receita</Text>
            <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>Share</Text>
          </View>

          {categories.slice(0, 10).map((cat, idx) => (
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

        {/* Rodapé */}
        <Text style={styles.footer}>
          MicroBi Analytics • Processamento Estático e Privado
        </Text>
      </Page>
    </Document>
  );
}
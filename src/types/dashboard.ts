/**
 * Métricas principais (KPIs) exibidas nos cards do Dashboard
 */
export interface DashboardKPIs {
  totalRevenue: number;
  averageTicket: number;
  totalSalesCount: number;
}

/**
 * Ponto de dado para o gráfico de linha/área temporal de faturamento
 */
export interface RevenueTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  formattedDate: string; // Ex: 05/01/2026
  total: number;
  count: number;
}

/**
 * Agregação de vendas por categoria de produto
 */
export interface CategoryAggregation {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

/**
 * Opções de filtro e ordenação para a tabela de dados
 */
export interface TableFilterOptions {
  searchQuery: string;
  categoryFilter: string;
  sortBy: "date" | "value" | "category";
  sortOrder: "asc" | "desc";
}

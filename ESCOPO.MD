# ESCOPO.md

## 🛠️ Stack Técnica Final (Slim & SaaS-ready)

- **Framework:** Next.js (App Router, TypeScript)
- **Hosting:** Cloudflare Pages (via Static Export)
- **UI & Design:** Tailwind CSS + Shadcn/UI (Cards, Dialogs, Selects, Dropdown)
- **Ícones:** Lucide React
- **Gráficos:** Recharts (integrado perfeitamente com o Shadcn Charts)
- **Parsing de CSV:** `papaparse` (leve, rápido e seguro no browser)
- **Gerenciamento de Estado Global:** `zustand` (para trafegar o dataset parseado entre a tela de upload/demo e a tela do dashboard)
- **Gerador de PDF:** `@react-pdf/renderer` (gera o PDF no próprio navegador do usuário)

---

## 📁 Estrutura de Pastas do Projeto

Abaixo está a arquitetura modular e organizada para o projeto:

```
microbi/
├── public/
│   └── demo/
│       └── ecommerce-sample.csv    # Dataset sintético ultra-realista para o botão "Modo Demo"
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root Layout + Providers
│   │   ├── page.tsx                # Tela Inicial / Landing + Drag & Drop Upload
│   │   └── dashboard/
│   │       └── page.tsx            # Painel Principal (KPIs, Gráficos, Tabelas)
│   ├── components/
│   │   ├── ui/                     # Componentes do Shadcn UI (Button, Card, Table, etc.)
│   │   ├── dashboard/               # Módulos visuais do painel
│   │   │   ├── kpi-card.tsx         # Card de métrica (Ex: Faturamento, Ticket Médio)
│   │   │   ├── revenue-chart.tsx    # Gráfico temporal de faturamento
│   │   │   ├── category-chart.tsx   # Gráfico de pizza/barras por categoria
│   │   │   └── data-table.tsx       # Tabela tratada com busca/ordenação
│   │   ├── upload/                  # Módulo de entrada de dados
│   │   │   ├── dropzone.tsx         # Drag & Drop para arquivo local
│   │   │   └── column-mapper.tsx    # Modal de confirmação do de-para de colunas
│   │   └── pdf/
│   │       └── report-pdf.tsx       # Template do relatório executivo em PDF
│   ├── lib/
│   │   ├── parser.ts                # Lógica do PapaParse + sanitização das linhas
│   │   ├── analytics.ts             # Funções puras em TS que calculam os KPIs e Agregações
│   │   ├── formatters.ts            # Formatadores de Moeda (R$), Datas e Percentuais
│   │   └── utils.ts                 # Utilitários gerais do Tailwind (cn)
│   ├── store/
│   │   └── use-data-store.ts        # Estado do Zustand (guarda os dados brutos e mapeados)
│   └── types/
│       └── index.ts                 # Interfaces TypeScript para os registros e métricas
├── next.config.mjs                 # Configuração com output: 'export'
├── tailwind.config.ts
└── package.json
```

---

## 🧠 Como os Dados Vão Fluir no App (Data Flow)

### 1. Entrada de Dados (Upload ou Demo)

- Se o usuário clicar em **"Carregar Dados de Exemplo"**, o app faz um `fetch('/demo/ecommerce-sample.csv')`.
- Se ele arrastar um CSV próprio, o `papaparse` lê o arquivo localmente no navegador.

### 2. Sanitização & Mapeamento (`lib/parser.ts`)

O sistema lê as colunas e tenta inferir:

- Qual coluna é a **Data**? (busca por `data`, `date`, `created_at`).
- Qual coluna é o **Valor**? (busca por `valor`, `price`, `total`, `faturamento`).
- Qual coluna é a **Categoria**? (busca por `categoria`, `produto`, `type`).

### 3. Armazenamento em Memória (`store/use-data-store.ts`)

- O Zustand guarda a lista de objetos já normalizada e redireciona o usuário para a rota `/dashboard`.

### 4. Cálculo de Análises (`lib/analytics.ts`)

Funções puras filtram e agregam os dados em tempo de execução:

- `calculateKPIs(data)` → Retorna Faturamento Total, Ticket Médio, Qtd de Vendas.
- `getRevenueOverTime(data, period)` → Retorna array pronto para o Recharts `{ date: '2026-03-01', total: 1500 }`.

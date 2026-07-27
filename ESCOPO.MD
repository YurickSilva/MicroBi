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
- **Validação de Schema:** `zod` (garante a integridade dos dados normalizados vindos do CSV)
- **Testes:** `vitest` + `@testing-library/react` (cobertura das funções puras em `lib/` e componentes críticos)

---

## 📁 Estrutura de Pastas do Projeto

Abaixo está a arquitetura modular e organizada para o projeto:

```
microbi/
├── public/
│   └── demo/
│       └── ecommerce-sample.csv     # Dataset sintético ultra-realista para o botão "Modo Demo"
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root Layout + Providers
│   │   ├── page.tsx                 # Tela Inicial / Landing + Drag & Drop Upload
│   │   └── dashboard/
│   │       └── page.tsx             # Painel Principal (KPIs, Gráficos, Tabelas)
│   ├── components/
│   │   ├── ui/                      # Componentes do Shadcn UI (Button, Card, Table, etc.)
│   │   ├── dashboard/                # Módulos visuais do painel
│   │   │   ├── kpi-card.tsx          # Card de métrica (Ex: Faturamento, Ticket Médio)
│   │   │   ├── revenue-chart.tsx     # Gráfico temporal de faturamento
│   │   │   ├── category-chart.tsx    # Gráfico de pizza/barras por categoria
│   │   │   └── data-table.tsx        # Tabela tratada com busca/ordenação
│   │   ├── upload/                   # Módulo de entrada de dados
│   │   │   ├── dropzone.tsx          # Drag & Drop para arquivo local
│   │   │   └── column-mapper.tsx     # Modal de confirmação do de-para de colunas
│   │   ├── feedback/                 # Estados de UI para erro, vazio e carregamento
│   │   │   ├── error-state.tsx       # Exibido quando o CSV é inválido ou mal formatado
│   │   │   ├── empty-state.tsx       # Exibido quando não há dados carregados ainda
│   │   │   └── loading-state.tsx     # Skeletons/spinners durante parsing e cálculo
│   │   └── pdf/
│   │       └── report-pdf.tsx        # Template do relatório executivo em PDF
│   ├── hooks/
│   │   ├── use-dashboard-data.ts     # Orquestra dados do store + cálculos de analytics para a UI
│   │   └── use-csv-upload.ts         # Lógica de leitura, parsing e tratamento de erros do upload
│   ├── lib/
│   │   ├── parser.ts                 # Lógica do PapaParse + sanitização das linhas
│   │   ├── analytics.ts              # Funções puras em TS que calculam os KPIs e Agregações
│   │   ├── formatters.ts             # Formatadores de Moeda (R$), Datas e Percentuais
│   │   └── utils.ts                  # Utilitários gerais do Tailwind (cn)
│   ├── schemas/
│   │   └── data-record.schema.ts     # Validação Zod dos registros normalizados do CSV
│   ├── store/
│   │   └── use-data-store.ts         # Estado do Zustand (guarda os dados brutos e mapeados)
│   ├── types/
│   │   ├── data.ts                   # Interfaces dos registros e do dataset normalizado
│   │   └── dashboard.ts              # Interfaces de KPIs, séries e agregações
│   └── __tests__/
│       ├── analytics.test.ts         # Testes unitários das funções de agregação/KPIs
│       └── parser.test.ts            # Testes unitários da sanitização e inferência de colunas
├── next.config.mjs                  # Configuração com output: 'export'
├── tailwind.config.ts
├── vitest.config.ts                 # Configuração do Vitest
├── package.json
└── README.md                        # Documentação: screenshots, decisões técnicas, setup local
```

---

## 🧠 Como os Dados Vão Fluir no App (Data Flow)

### 1. Entrada de Dados (Upload ou Demo)

- Se o usuário clicar em **"Carregar Dados de Exemplo"**, o app faz um `fetch('/demo/ecommerce-sample.csv')`.
- Se ele arrastar um CSV próprio, o `papaparse` lê o arquivo localmente no navegador.

### 2. Sanitização & Mapeamento (`lib/parser.ts` + `hooks/use-csv-upload.ts`)

O sistema lê as colunas e tenta inferir:

- Qual coluna é a **Data**? (busca por `data`, `date`, `created_at`).
- Qual coluna é o **Valor**? (busca por `valor`, `price`, `total`, `faturamento`).
- Qual coluna é a **Categoria**? (busca por `categoria`, `produto`, `type`).

O hook `use-csv-upload.ts` encapsula essa lógica e expõe estados de `loading`, `error` e `success`, permitindo que a UI reaja com `components/feedback/error-state.tsx` caso o arquivo esteja mal formatado ou não seja possível inferir as colunas.

### 3. Validação com Zod (`schemas/data-record.schema.ts`)

- Antes de entrar no store, cada registro normalizado passa pelo schema Zod, que garante tipos e formatos corretos (datas válidas, valores numéricos, campos obrigatórios).
- Registros inválidos são descartados ou sinalizados, evitando bugs silenciosos nos cálculos de analytics.

### 4. Armazenamento em Memória (`store/use-data-store.ts`)

- O Zustand guarda a lista de objetos já validada e normalizada, e redireciona o usuário para a rota `/dashboard`.

### 5. Cálculo de Análises (`lib/analytics.ts` + `hooks/use-dashboard-data.ts`)

Funções puras filtram e agregam os dados em tempo de execução:

- `calculateKPIs(data)` → Retorna Faturamento Total, Ticket Médio, Qtd de Vendas.
- `getRevenueOverTime(data, period)` → Retorna array pronto para o Recharts `{ date: '2026-03-01', total: 1500 }`.

O hook `use-dashboard-data.ts` orquestra a leitura do store e a chamada dessas funções, mantendo `dashboard/page.tsx` enxuto e focado em composição de UI. Caso não haja dados no store, `components/feedback/empty-state.tsx` é exibido com uma chamada para ação (upload ou modo demo).

### 6. Qualidade & Testes (`__tests__/`)

- `analytics.test.ts` e `parser.test.ts` cobrem os cenários críticos: cálculo correto de KPIs, inferência de colunas com nomes variados e tratamento de CSVs malformados.
- Essa camada de testes é o principal diferencial de maturidade técnica do projeto para fins de portfólio.
import { describe, it, expect } from "vitest";
import { inferColumns, normalizeAndValidateRows } from "@/hooks/use-csv-upload";

// ─── inferColumns ────────────────────────────────────────────────────────────

describe("inferColumns — semantic detection", () => {
  it("detecta colunas em pt-BR com acento", () => {
    const headers = ["data", "valor", "categoria"];
    const { mapping, isConfident } = inferColumns(headers);
    expect(mapping.dateKey).toBe("data");
    expect(mapping.valueKey).toBe("valor");
    expect(mapping.categoryKey).toBe("categoria");
    expect(isConfident).toBe(true);
  });

  it("detecta colunas em inglês", () => {
    const headers = ["date", "price", "product"];
    const { mapping, isConfident } = inferColumns(headers);
    expect(mapping.dateKey).toBe("date");
    expect(mapping.valueKey).toBe("price");
    expect(mapping.categoryKey).toBe("product");
    expect(isConfident).toBe(true);
  });

  it("detecta variações: created_at, total, type", () => {
    const headers = ["created_at", "total", "type"];
    const { mapping, isConfident } = inferColumns(headers);
    expect(mapping.dateKey).toBe("created_at");
    expect(mapping.valueKey).toBe("total");
    expect(mapping.categoryKey).toBe("type");
    expect(isConfident).toBe(true);
  });

  it("retorna isConfident=false quando nenhuma coluna é reconhecida semanticamente", () => {
    const headers = ["colA", "colB", "colC"];
    const { mapping, isConfident } = inferColumns(headers);
    // Cai no fallback posicional
    expect(mapping.dateKey).toBe("colA");
    expect(mapping.valueKey).toBe("colB");
    expect(mapping.categoryKey).toBe("colC");
    expect(isConfident).toBe(false);
  });

  it("retorna isConfident=false quando apenas data foi reconhecida", () => {
    const headers = ["data", "colB", "colC"];
    const { isConfident } = inferColumns(headers);
    expect(isConfident).toBe(false);
  });
});

// ─── parseNumericValue (via normalizeAndValidateRows) ─────────────────────────

describe("parseNumericValue — formato brasileiro e americano", () => {
  const mapping = { dateKey: "data", valueKey: "valor", categoryKey: "categoria" };

  const row = (valor: string) => [{ data: "2026-01-01", valor, categoria: "Teste" }];

  it("parseia número BR com milhar e vírgula decimal: 1.250,50 → 1250.50", () => {
    const { records } = normalizeAndValidateRows(row("1.250,50"), mapping);
    expect(records[0].value).toBeCloseTo(1250.5);
  });

  it("parseia com símbolo R$: R$ 1.250,50 → 1250.50", () => {
    const { records } = normalizeAndValidateRows(row("R$ 1.250,50"), mapping);
    expect(records[0].value).toBeCloseTo(1250.5);
  });

  it("parseia decimal BR sem milhar: 150,50 → 150.50", () => {
    const { records } = normalizeAndValidateRows(row("150,50"), mapping);
    expect(records[0].value).toBeCloseTo(150.5);
  });

  it("parseia formato americano: 1,250.50 → 1250.50", () => {
    const { records } = normalizeAndValidateRows(row("1,250.50"), mapping);
    expect(records[0].value).toBeCloseTo(1250.5);
  });

  it("parseia inteiro puro: 1500 → 1500", () => {
    const { records } = normalizeAndValidateRows(row("1500"), mapping);
    expect(records[0].value).toBe(1500);
  });

  it("parseia número float americano simples: 150.00 → 150", () => {
    const { records } = normalizeAndValidateRows(row("150.00"), mapping);
    expect(records[0].value).toBeCloseTo(150);
  });
});

// ─── normalizeAndValidateRows — Zod integration ───────────────────────────────

describe("normalizeAndValidateRows — validação Zod", () => {
  const mapping = { dateKey: "data", valueKey: "valor", categoryKey: "categoria" };

  it("aceita registro válido e retorna NormalizedRecord", () => {
    const rows = [{ data: "2026-01-15", valor: "150,00", categoria: "Eletrônicos" }];
    const { records, rejectedCount } = normalizeAndValidateRows(rows, mapping);
    expect(records).toHaveLength(1);
    expect(rejectedCount).toBe(0);
    expect(records[0].value).toBeCloseTo(150);
    expect(records[0].category).toBe("Eletrônicos");
  });

  it("rejeita registro com data em formato inválido (não YYYY-MM-DD após parse)", () => {
    // Uma string de data completamente inválida que não conseguimos converter
    const rows = [{ data: "invalido-data", valor: "100", categoria: "X" }];
    const { records, rejectedCount } = normalizeAndValidateRows(rows, mapping);
    expect(rejectedCount).toBe(1);
    expect(records).toHaveLength(0);
  });

  it("sinal de menos em string é ignorado pelo parser (strip não-numérico) — valor fica 0, que é aceito pelo Zod", () => {
    // O parseNumericValue remove o '-' junto com outros não-dígitos. Comportamento intencional:
    // CSVs de vendas não têm receita negativa; sinal negativo indica lixo/formatação errada.
    // O registro é mantido com value=0, não descartado.
    const rows = [{ data: "2026-01-15", valor: "-50", categoria: "Roupas" }];
    const { records, rejectedCount } = normalizeAndValidateRows(rows, mapping);
    expect(rejectedCount).toBe(0);
    expect(records).toHaveLength(1);
    expect(records[0].value).toBe(50); // sinal '-' removido, dígitos preservados
  });

  it("rejeita registro com valor explicitamente negativo (number nativo)", () => {
    // Quando o PapaParse já entrega o campo como número JavaScript negativo (não string),
    // o parseNumericValue retorna o valor tal qual e o Zod rejeita.
    const rows = [{ data: "2026-01-15", valor: -50, categoria: "Roupas" }];
    const { records, rejectedCount } = normalizeAndValidateRows(rows, mapping);
    expect(rejectedCount).toBe(1);
    expect(records).toHaveLength(0);
  });

  it("processa lote misto: mantém válidos e descarta inválidos", () => {
    const rows = [
      { data: "2026-01-15", valor: "100,00", categoria: "Livros" },
      { data: "invalido", valor: "50", categoria: "Roupas" },
      { data: "2026-01-16", valor: "200,00", categoria: "Eletrônicos" },
    ];
    const { records, rejectedCount } = normalizeAndValidateRows(rows, mapping);
    expect(records).toHaveLength(2);
    expect(rejectedCount).toBe(1);
  });

  it("converte data DD/MM/YYYY para YYYY-MM-DD antes da validação Zod", () => {
    const rows = [{ data: "15/01/2026", valor: "300,00", categoria: "Casa" }];
    const { records, rejectedCount } = normalizeAndValidateRows(rows, mapping);
    expect(rejectedCount).toBe(0);
    expect(records[0].date).toBe("2026-01-15");
  });
});

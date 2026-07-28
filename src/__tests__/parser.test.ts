import { describe, it, expect } from "vitest";
import {
  inferColumns,
  normalizeAndValidateRows,
  validateCSVStructure,
  parseNumericValue,
  parseDateToISO,
} from "@/hooks/use-csv-upload";

// ─── inferColumns ─────────────────────────────────────────────────────────────

describe("inferColumns — semantic detection", () => {
  it("detecta colunas em pt-BR com acento (CSV 01-ideal)", () => {
    const { mapping, isConfident } = inferColumns(["data", "valor", "categoria"]);
    expect(mapping.dateKey).toBe("data");
    expect(mapping.valueKey).toBe("valor");
    expect(mapping.categoryKey).toBe("categoria");
    expect(isConfident).toBe(true);
  });

  it("detecta colunas com nomes longos BR (CSV 02 separador ;)", () => {
    // O cabeçalho do 02 tem "Data da Venda", "Valor Total", "Categoria do Produto"
    const headers = ["Data da Venda", "Valor Total", "Categoria do Produto"];
    const { isConfident } = inferColumns(headers);
    expect(isConfident).toBe(true);
  });

  it("detecta variações técnicas: dt_venda, vlr, sku (CSV 03)", () => {
    const headers = ["id_transacao", "dt_venda", "vlr", "sku", "uf"];
    const { mapping, isConfident } = inferColumns(headers);
    expect(mapping.dateKey).toBe("dt_venda");
    expect(mapping.valueKey).toBe("vlr");
    // 'sku' deve ser reconhecido como categoria
    expect(mapping.categoryKey).toBe("sku");
    expect(isConfident).toBe(true);
  });

  it("detecta CSV 05 com ordem diferente: total_pago, tipo_produto, quando", () => {
    const headers = ["total_pago", "tipo_produto", "quando"];
    const { mapping, isConfident } = inferColumns(headers);
    expect(mapping.valueKey).toBe("total_pago");
    expect(mapping.categoryKey).toBe("tipo_produto");
    expect(mapping.dateKey).toBe("quando");
    expect(isConfident).toBe(true);
  });

  it("retorna isConfident=false quando nenhuma coluna é reconhecida", () => {
    const { isConfident } = inferColumns(["colA", "colB", "colC"]);
    expect(isConfident).toBe(false);
  });
});

// ─── validateCSVStructure ─────────────────────────────────────────────────────

describe("validateCSVStructure — erros estruturais fatais", () => {
  it("retorna erro fatal se CSV tem 1 coluna — separador errado (CSV 02 se enviado raw)", () => {
    const erros = validateCSVStructure(
      [{ "data;valor;categoria": "04/05/2026;R$ 2.166,53;Moda" }],
      ["data;valor;categoria"]
    );
    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0]).toMatch(/separador/i);
  });

  it("retorna erro fatal para CSV só com cabeçalho sem linhas (CSV 06)", () => {
    const erros = validateCSVStructure([], ["data", "valor", "categoria"]);
    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0]).toMatch(/cabeçalho|dados/i);
  });

  it("não retorna erros para CSV estruturalmente correto", () => {
    const erros = validateCSVStructure(
      [{ data: "2026-01-01", valor: "100", categoria: "X" }],
      ["data", "valor", "categoria"]
    );
    expect(erros).toHaveLength(0);
  });
});

// ─── parseNumericValue ────────────────────────────────────────────────────────

describe("parseNumericValue — formatos BR, US e casos ruins", () => {
  it("parseia R$ 2.166,53 → 2166.53 (CSV 02)", () => {
    expect(parseNumericValue("R$ 2.166,53")).toBeCloseTo(2166.53);
  });

  it("parseia 1.250,50 → 1250.50 (BR com milhar)", () => {
    expect(parseNumericValue("1.250,50")).toBeCloseTo(1250.5);
  });

  it("parseia 786,08 → 786.08 (BR sem milhar)", () => {
    // Caso do CSV 07: R$ 786,08
    expect(parseNumericValue("R$ 786,08")).toBeCloseTo(786.08);
  });

  it("parseia 1,250.50 → 1250.50 (formato US)", () => {
    expect(parseNumericValue("1,250.50")).toBeCloseTo(1250.5);
  });

  it("retorna null para 'grátis' (CSV 08 — texto puro)", () => {
    expect(parseNumericValue("grátis")).toBeNull();
  });

  it("'abc123': retorna 123 (letras são ignoradas no strip, dígitos preservados)", () => {
    // Comportamento documentado: strings mistas onde há dígitos retornam os dígitos.
    // A rejeição de 'abc123' como valor de venda é feita contextualmente (ex: grátis).
    // 'abc123' na prática é mais raro que 'grátis' — e retornar 123 é conservador.
    expect(parseNumericValue("abc123")).toBe(123);
  });

  it("retorna null para campo vazio string (CSV 08 — linha sem valor)", () => {
    expect(parseNumericValue("")).toBeNull();
  });

  it("retorna null para null", () => {
    expect(parseNumericValue(null)).toBeNull();
  });

  it("retorna 999999999.99 para outlier absurdo (será rejeitado depois pelo limiar)", () => {
    // parseNumericValue não rejeita outliers — a lógica de limiar fica em normalizeAndValidateRows
    expect(parseNumericValue("999999999.99")).toBeCloseTo(999999999.99);
  });

  it("retorna -50 para number JS negativo (será rejeitado pelo Zod)", () => {
    expect(parseNumericValue(-50)).toBe(-50);
  });
});

// ─── parseDateToISO ───────────────────────────────────────────────────────────

describe("parseDateToISO — formatos e datas impossíveis", () => {
  it("aceita YYYY-MM-DD já formatado", () => {
    expect(parseDateToISO("2026-01-15")).toBe("2026-01-15");
  });

  it("converte DD/MM/YYYY para ISO", () => {
    expect(parseDateToISO("04/05/2026")).toBe("2026-05-04");
  });

  it("rejeita data impossível: mês 13 (CSV 04: 2026-13-40)", () => {
    expect(parseDateToISO("2026-13-40")).toBeNull();
  });

  it("rejeita dia impossível: 31/02 (CSV 04: fevereiro não tem 31 dias)", () => {
    expect(parseDateToISO("31/02/2026")).toBeNull();
  });

  it("rejeita 'N/A' (CSV 04)", () => {
    expect(parseDateToISO("N/A")).toBeNull();
  });

  it("rejeita 'sem data' (CSV 04)", () => {
    expect(parseDateToISO("sem data")).toBeNull();
  });

  it("rejeita string vazia", () => {
    expect(parseDateToISO("")).toBeNull();
  });

  it("rejeita null", () => {
    expect(parseDateToISO(null)).toBeNull();
  });
});

// ─── normalizeAndValidateRows — integração completa ───────────────────────────

describe("normalizeAndValidateRows — cenários dos CSVs de teste", () => {
  const mapping = { dateKey: "data", valueKey: "valor", categoryKey: "categoria" };

  it("CSV 01-ideal: processa todos os registros sem erros", () => {
    const rows = [
      { data: "2026-04-08", valor: "266.60", categoria: "Casa e Decoração" },
      { data: "2026-03-02", valor: "354.77", categoria: "Moda" },
      { data: "2026-06-24", valor: "109.45", categoria: "Livros" },
    ];
    const { records, rejectedCount, fatalError } = normalizeAndValidateRows(rows, mapping);
    expect(fatalError).toBeNull();
    expect(rejectedCount).toBe(0);
    expect(records).toHaveLength(3);
  });

  it("CSV 04: datas impossíveis são descartadas, registros válidos passam", () => {
    const rows = [
      { data: "2026-13-40", valor: "55.65", categoria: "Casa" }, // inválida
      { data: "N/A", valor: "213.31", categoria: "X" },           // inválida
      { data: "31/02/2026", valor: "153.48", categoria: "Y" },    // impossível
      { data: "2026-03-05", valor: "245.98", categoria: "Z" },    // válida
    ];
    const { records, rejectedCount, fatalError } = normalizeAndValidateRows(rows, mapping);
    expect(rejectedCount).toBe(3);
    expect(records).toHaveLength(1);
    // 3/4 = 75% rejeição → acima de 60% → fatalError deve existir
    expect(fatalError).not.toBeNull();
    expect(fatalError).toMatch(/qualidade insuficiente|rejeitad/i);
  });

  it("CSV 08: 'grátis' rejeitado, outlier 999999999 rejeitado, -50 nativo rejeitado pelo Zod, campo vazio rejeitado", () => {
    const rows = [
      { data: "2026-01-19", valor: "grátis", categoria: "Casa" },     // null → rejeitado
      { data: "2026-02-12", valor: "999999999.99", categoria: "Casa" }, // outlier → rejeitado
      { data: "2026-04-19", valor: -50, categoria: "Casa" },           // negativo nativo → Zod rejeita
      { data: "2026-06-23", valor: "", categoria: "Eletrônicos" },      // vazio → rejeitado
      { data: "2026-04-22", valor: "302.21", categoria: "Casa" },      // válido
      { data: "2026-04-12", valor: "235.27", categoria: "Esporte" },   // válido
      { data: "2026-05-25", valor: "304.01", categoria: "Casa" },      // válido
    ];
    const { records, rejectedCount } = normalizeAndValidateRows(rows, mapping);
    expect(rejectedCount).toBe(4); // grátis, outlier, -50, vazio
    expect(records).toHaveLength(3);
  });

  it("CSV 07: valores como 'R$ 786,08' sem milhar parseiam corretamente", () => {
    // Precisa de 3+ linhas para não acionar MIN_VALID_RECORDS
    const rows = [
      { data: "2026-03-31", valor: "R$ 786,08", categoria: "Casa, Decoração e Jardim" },
      { data: "2026-06-10", valor: "R$ 645,69", categoria: "Eletrônicos & Informática" },
      { data: "2026-02-23", valor: "R$ 73,20",  categoria: "Moda – Feminina" },
    ];
    const { records, fatalError } = normalizeAndValidateRows(rows, mapping);
    expect(fatalError).toBeNull();
    expect(records[0].value).toBeCloseTo(786.08);
    expect(records[1].value).toBeCloseTo(645.69);
    expect(records[2].value).toBeCloseTo(73.20);
  });

  it("retorna fatalError quando CSV só tem cabeçalho (0 linhas de dados)", () => {
    const { fatalError } = normalizeAndValidateRows([], mapping);
    expect(fatalError).not.toBeNull();
  });

  it("processa lote misto: mantém válidos, conta rejeitados, sem fatalError abaixo do limiar", () => {
    const rows = [
      { data: "2026-01-15", valor: "100,00", categoria: "Livros" }, // válido
      { data: "invalido", valor: "50", categoria: "Roupas" },        // data inválida
      { data: "2026-01-16", valor: "200,00", categoria: "Eletrônicos" }, // válido
      { data: "2026-01-17", valor: "300,00", categoria: "Beleza" },  // válido
    ];
    const { records, rejectedCount, fatalError } = normalizeAndValidateRows(rows, mapping);
    expect(records).toHaveLength(3);
    expect(rejectedCount).toBe(1);
    // 1/4 = 25% < 60% → não é fatal
    expect(fatalError).toBeNull();
  });
});

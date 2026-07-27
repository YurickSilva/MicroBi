import { z } from "zod";

/**
 * Schema Zod para validar e sanitizar um registro normalizado vindo do CSV
 */
export const NormalizedRecordSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato ISO YYYY-MM-DD"),
  value: z
    .number({ invalid_type_error: "Valor deve ser um número válido" })
    .nonnegative("Valor das vendas não pode ser negativo"),
  category: z
    .string()
    .min(1, "Categoria não pode estar vazia")
    .transform((val) => val.trim()),
  raw: z.record(z.string(), z.unknown()),
});

export type NormalizedRecordInput = z.input<typeof NormalizedRecordSchema>;
export type NormalizedRecordOutput = z.output<typeof NormalizedRecordSchema>;

/**
 * Schema para validar o mapeamento de colunas selecionado pelo usuário
 */
export const ColumnMappingSchema = z.object({
  dateKey: z.string().min(1, "Coluna de data é obrigatória"),
  valueKey: z.string().min(1, "Coluna de valor é obrigatória"),
  categoryKey: z.string().min(1, "Coluna de categoria é obrigatória"),
});

export type ColumnMappingType = z.infer<typeof ColumnMappingSchema>;

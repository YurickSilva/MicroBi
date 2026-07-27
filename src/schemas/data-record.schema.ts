import { z } from "zod";

export const NormalizedRecordSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  value: z.number().nonnegative("Valor não pode ser negativo"),
  category: z.string().min(1, "Categoria não pode ser vazia"),
  raw: z.record(z.string(), z.unknown()),
});

export type NormalizedRecordSchemaType = z.infer<typeof NormalizedRecordSchema>;

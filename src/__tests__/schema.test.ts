import { describe, it, expect } from "vitest";
import { NormalizedRecordSchema } from "@/schemas/data-record.schema";

describe("NormalizedRecordSchema validation", () => {
  it("should validate a correct record", () => {
    const validRecord = {
      id: "rec_1",
      date: "2026-01-15",
      value: 150.5,
      category: "Eletrônicos",
      raw: { data: "2026-01-15", valor: "150.50" },
    };

    const result = NormalizedRecordSchema.safeParse(validRecord);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Eletrônicos");
    }
  });

  it("should fail validation when date format is invalid", () => {
    const invalidRecord = {
      id: "rec_2",
      date: "15/01/2026", // Invalid format for normalized schema (must be YYYY-MM-DD)
      value: 100,
      category: "Roupas",
      raw: {},
    };

    const result = NormalizedRecordSchema.safeParse(invalidRecord);
    expect(result.success).toBe(false);
  });

  it("should fail validation when value is negative", () => {
    const invalidRecord = {
      id: "rec_3",
      date: "2026-01-15",
      value: -50,
      category: "Livros",
      raw: {},
    };

    const result = NormalizedRecordSchema.safeParse(invalidRecord);
    expect(result.success).toBe(false);
  });
});

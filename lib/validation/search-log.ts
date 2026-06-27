import { z } from "zod";
import { filterShape, hasFields } from "@/lib/validation/mongodb-common";

const yearRangeSchema = z
  .object({
    from: z.number().int().nullable().optional(),
    to: z.number().int().nullable().optional(),
  })
  .strict()
  .refine(({ from, to }) => from == null || to == null || from <= to, {
    message: "from cannot be greater than to",
  });

export const searchLogQuerySchema = z
  .object({
    ...filterShape,
    transaction_year: yearRangeSchema.optional(),
  })
  .strict()
  .refine(hasFields, { message: "At least one search filter is required" });

export const createSearchLogSchema = z
  .object({
    user_id: z.string().min(1),
    query: searchLogQuerySchema,
  })
  .strict();

export const updateSearchLogSchema = z
  .object({
    query: searchLogQuerySchema,
  })
  .strict();

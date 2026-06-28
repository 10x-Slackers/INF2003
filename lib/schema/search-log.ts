import { z } from "zod";
import { filterShape, hasFields } from "@/lib/schema/mongodb-common";

const yearRangeSchema = z
  .object({
    from: z.number().int().nullable().optional(),
    to: z.number().int().nullable().optional(),
  })
  .strict()
  .refine(({ from, to }) => from == null || to == null || from <= to, {
    message: "from cannot be greater than to",
  });

export const querySearchLogSchema = z
  .object({
    ...filterShape,
    transaction_year: yearRangeSchema.optional(),
  })
  .strict()
  .refine(hasFields, { message: "At least one search filter is required" });

export const searchLogSchema = z.object({
  _id: z.uuid(),
  user_id: z.uuid(),
  query: querySearchLogSchema,
  searched_at: z.number().int().min(0),
});

export const createSearchLogSchema = z
  .object({
    user_id: z.uuid(),
    query: querySearchLogSchema,
  })
  .strict();

export const updateSearchLogSchema = z
  .object({
    query: querySearchLogSchema,
  })
  .strict();

export type SearchLogQuery = z.infer<typeof querySearchLogSchema>;
export type SearchLog = z.infer<typeof searchLogSchema>;
export type SearchLogCreate = z.infer<typeof createSearchLogSchema>;
export type SearchLogUpdate = z.infer<typeof updateSearchLogSchema>;

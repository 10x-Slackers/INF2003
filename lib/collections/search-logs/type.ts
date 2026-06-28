import { z } from "zod";

export const idSchema = z.uuid();

const numberRangeSchema = z
  .object({
    min: z.number().min(0).nullable().optional(),
    max: z.number().min(0).nullable().optional(),
  })
  .strict()
  .refine(({ min, max }) => min == null || max == null || min <= max, {
    message: "min cannot be greater than max",
  });

const yearRangeSchema = z
  .object({
    from: z.number().int().nullable().optional(),
    to: z.number().int().nullable().optional(),
  })
  .strict()
  .refine(({ from, to }) => from == null || to == null || from <= to, {
    message: "from cannot be greater than to",
  });

const filterShape = {
  town_id: z.array(z.uuid()).optional(),
  flat_model_id: z.array(z.string()).optional(),
  flat_type_id: z.array(z.string()).optional(),
  price: numberRangeSchema.optional(),
  floor_area_sqm: numberRangeSchema.optional(),
  storey: numberRangeSchema.optional(),
  lease_remaining: numberRangeSchema.optional(),
};

const hasFields = (value: object) => Object.keys(value).length > 0;

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

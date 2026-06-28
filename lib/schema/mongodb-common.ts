import { z } from "zod";

export const numberRangeSchema = z
  .object({
    min: z.number().min(0).nullable().optional(),
    max: z.number().min(0).nullable().optional(),
  })
  .strict()
  .refine(({ min, max }) => min == null || max == null || min <= max, {
    message: "min cannot be greater than max",
  });

const numericIdSchema = z.array(z.number().int().min(0));

export const filterShape = z.object({
  town_id: z.array(z.uuid()).optional(),
  flat_model_id: numericIdSchema,
  flat_type_id: numericIdSchema,
  price: numberRangeSchema.optional(),
  floor_area_sqm: numberRangeSchema.optional(),
  storey: numberRangeSchema.optional(),
  lease_remaining: numberRangeSchema.optional(),
});

export const hasFields = (value: object) => Object.keys(value).length > 0;
export const idSchema = z.string().min(1);

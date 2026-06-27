import { z } from "zod";

export const numberRangeSchema = z
  .object({
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
  })
  .strict()
  .refine(({ min, max }) => min == null || max == null || min <= max, {
    message: "min cannot be greater than max",
  });

const stringListSchema = z.array(z.string().min(1)).min(1);

export const filterShape = {
  town_id: stringListSchema.optional(),
  flat_model_id: stringListSchema.optional(),
  flat_type_id: stringListSchema.optional(),
  price: numberRangeSchema.optional(),
  floor_area_sqm: numberRangeSchema.optional(),
  storey: numberRangeSchema.optional(),
  lease_remaining: numberRangeSchema.optional(),
};

export const hasFields = (value: object) => Object.keys(value).length > 0;

export const idSchema = z.string().min(1);

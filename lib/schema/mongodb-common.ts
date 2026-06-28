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

export const filterShape = {
  town_id: z.array(z.uuid()).optional(),
  flat_model_id: z.array(z.string()).optional(),
  flat_type_id: z.array(z.string()).optional(),
  price: numberRangeSchema.optional(),
  floor_area_sqm: numberRangeSchema.optional(),
  storey: numberRangeSchema.optional(),
  lease_remaining: numberRangeSchema.optional(),
};

export const filterShapeSchema = z.object(filterShape).strict();

export const now = () => Math.floor(Date.now() / 1000);

export const hasFields = (value: object) => Object.keys(value).length > 0;
export const idSchema = z.uuid();

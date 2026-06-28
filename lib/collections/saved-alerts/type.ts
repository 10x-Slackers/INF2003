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

export const savedAlertFiltersSchema = z
  .object(filterShape)
  .strict()
  .refine(hasFields, { message: "At least one filter is required" });

export const createSavedAlertSchema = z
  .object({
    user_id: z.uuid(),
    filters: savedAlertFiltersSchema,
    is_active: z.boolean().optional(),
  })
  .strict();

export const updateSavedAlertSchema = z
  .object({
    filters: savedAlertFiltersSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .strict()
  .refine(hasFields, { message: "At least one field is required" });

export const savedAlertSchema = z.object({
  _id: z.uuid(),
  user_id: z.uuid(),
  filters: savedAlertFiltersSchema,
  is_active: z.boolean(),
  created_at: z.number().int().min(0),
  updated_at: z.number().int().min(0),
  last_triggered_at: z.number().int().min(0).optional(),
});

export type SavedAlertFilters = z.infer<typeof savedAlertFiltersSchema>;
export type SavedAlertCreate = z.infer<typeof createSavedAlertSchema>;
export type SavedAlertUpdate = z.infer<typeof updateSavedAlertSchema>;
export type SavedAlert = z.infer<typeof savedAlertSchema>;

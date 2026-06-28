import { z } from "zod";
import { filterShape, hasFields } from "@/lib/schema/mongodb-common";

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

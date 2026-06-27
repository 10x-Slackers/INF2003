import { z } from "zod";
import { filterShape, hasFields } from "@/lib/validation/mongodb-common";

export const savedAlertFiltersSchema = z
  .object(filterShape)
  .strict()
  .refine(hasFields, { message: "At least one filter is required" });

export const createSavedAlertSchema = z
  .object({
    user_id: z.string().min(1),
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

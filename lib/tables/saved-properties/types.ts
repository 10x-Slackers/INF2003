import { z } from "zod";
import type { PropertyWithLatestTransaction } from "@/lib/tables/properties/types";
import { paginationSchema, idSchema } from "../common";

export const createSavedPropertySchema = z.object({
  userId: idSchema,
  propertyId: z.uuid(),
});
export const savedPropertyListQuerySchema = paginationSchema.extend({
  userId: idSchema,
});
export const savedPropertyIdentitySchema = z.object({
  userId: idSchema,
  propertyId: idSchema,
});
export const updateSavedPropertyParamsSchema = z.object({
  id: idSchema,
  input: createSavedPropertySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided.",
    }),
});

export type SavedProperty = {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
};

export type SavedPropertyDetail = SavedProperty & {
  property: PropertyWithLatestTransaction | null;
};
export type SavedPropertyListQuery = z.infer<
  typeof savedPropertyListQuerySchema
>;

export type CreateSavedProperty = z.infer<typeof createSavedPropertySchema>;
export type SavedPropertyIdentity = z.infer<typeof savedPropertyIdentitySchema>;
export type UpdateSavedPropertyParams = z.infer<
  typeof updateSavedPropertyParamsSchema
>;

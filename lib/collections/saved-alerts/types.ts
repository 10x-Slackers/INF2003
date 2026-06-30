import { z } from "zod";

export const idSchema = z.uuid();

const numberRangeSchema = z
  .object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  })
  .strict()
  .refine(
    ({ min, max }) => min === undefined || max === undefined || min <= max,
    {
      message: "min cannot be greater than max",
    },
  );

const storeyRangeSchema = z
  .object({
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(0).optional(),
  })
  .strict()
  .refine(
    ({ min, max }) => min === undefined || max === undefined || min <= max,
    {
      message: "min cannot be greater than max",
    },
  );

const filterShape = {
  townId: z.array(z.uuid()).optional(),
  flatModelId: z.array(z.string()).optional(),
  flatTypeId: z.array(z.string()).optional(),
  price: numberRangeSchema.optional(),
  floorAreaSqm: numberRangeSchema.optional(),
  storey: storeyRangeSchema.optional(),
  leaseRemaining: numberRangeSchema.optional(),
};

const hasFields = (value: object) => Object.keys(value).length > 0;

export const savedAlertFiltersSchema = z
  .object(filterShape)
  .strict()
  .refine(hasFields, { message: "At least one filter is required" });

export const createSavedAlertSchema = z
  .object({
    userId: z.uuid(),
    filters: savedAlertFiltersSchema,
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateSavedAlertSchema = z
  .object({
    filters: savedAlertFiltersSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(hasFields, { message: "At least one field is required" });
export const updateSavedAlertParamsSchema = z
  .object({
    id: idSchema,
    input: updateSavedAlertSchema,
  })
  .strict();

type SavedAlertFilters = z.infer<typeof savedAlertFiltersSchema>;
export type SavedAlertCreate = z.infer<typeof createSavedAlertSchema>;
export type SavedAlertUpdate = z.infer<typeof updateSavedAlertSchema>;
export type SavedAlertUpdateParams = z.infer<
  typeof updateSavedAlertParamsSchema
>;
export type SavedAlert = {
  _id: string;
  userId: string;
  filters: SavedAlertFilters;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastTriggeredAt?: number;
};

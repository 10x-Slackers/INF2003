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

const transactionStoreyRangeSchema = z
  .object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
  })
  .strict()
  .refine(({ min, max }) => min <= max, {
    message: "min cannot be greater than max",
  });

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
    id: idSchema,
    filters: savedAlertFiltersSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(hasFields, { message: "At least one field is required" });

export const alertTransactionFilterSchema = z
  .object({
    townId: z.uuid().optional(),
    flatModelId: z.number().optional(),
    flatTypeId: z.number().optional(),
    price: z.number().optional(),
    floorAreaSqm: z.number().optional(),
    storey: transactionStoreyRangeSchema.optional(),
    leaseRemaining: z.number().optional(),
  })
  .strict();

type SavedAlertFilters = z.infer<typeof savedAlertFiltersSchema>;
export type SavedAlertCreate = z.infer<typeof createSavedAlertSchema>;
export type SavedAlertUpdate = z.infer<typeof updateSavedAlertSchema>;
export type SavedAlert = {
  _id: string;
  userId: string;
  filters: SavedAlertFilters;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastTriggeredAt?: number;
};
export type AlertTransactionFilter = z.infer<
  typeof alertTransactionFilterSchema
>;

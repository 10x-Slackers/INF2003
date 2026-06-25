import { z } from "zod";
import { createPropertySchema } from "@/lib/validation/property";

const transactionFieldsSchema = z.object({
  flat_type_id: z.coerce.number().int().positive(),
  flat_model_id: z.coerce.number().int().positive(),
  storey_range_id: z.coerce.number().int().positive(),
  floor_area_sqm: z.coerce.number().positive(),
  transaction_month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  resale_price: z.coerce.number().positive(),
});

export const createTransactionSchema = z.union([
  transactionFieldsSchema.extend({ property_id: z.string().uuid() }),
  transactionFieldsSchema.extend({ property: createPropertySchema }),
]);

export const updateTransactionSchema = z
  .object({
    flat_type_id: z.coerce.number().int().positive().optional(),
    flat_model_id: z.coerce.number().int().positive().optional(),
    storey_range_id: z.coerce.number().int().positive().optional(),
    floor_area_sqm: z.coerce.number().positive().optional(),
    transaction_month: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
      .optional(),
    resale_price: z.coerce.number().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const transactionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  town_id: z.string().uuid().optional(),
  flat_type_id: z.coerce.number().int().positive().optional(),
  storey_range_id: z.coerce.number().int().positive().optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
  year: z.coerce.number().int().min(1960).max(2100).optional(),
  property_id: z.string().uuid().optional(),
});

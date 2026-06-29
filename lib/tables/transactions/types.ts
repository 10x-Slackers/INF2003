import { z } from "zod";
import { paginationSchema, idSchema } from "../common";

export const transactionMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export const createTransactionSchema = z.object({
  property_id: idSchema,
  flat_type_id: z.coerce.number().int().positive(),
  flat_model_id: z.coerce.number().int().positive(),
  storey_range_id: z.coerce.number().int().positive(),
  floor_area_sqm: z.coerce.number().positive(),
  transaction_month: transactionMonthSchema,
  resale_price: z.coerce.number().positive(),
});
export const updateTransactionSchema = z
  .object({
    flat_type_id: z.coerce.number().int().positive().optional(),
    flat_model_id: z.coerce.number().int().positive().optional(),
    storey_range_id: z.coerce.number().int().positive().optional(),
    floor_area_sqm: z.coerce.number().positive().optional(),
    transaction_month: transactionMonthSchema.optional(),
    resale_price: z.coerce.number().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });
export const transactionListQuerySchema = paginationSchema.extend({
  town_id: z.uuid().optional(),
  flat_type_id: z.coerce.number().int().positive().optional(),
  storey_range_id: z.coerce.number().int().positive().optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
  year: z.coerce.number().int().min(1960).max(2100).optional(),
  property_id: z.uuid().optional(),
});

export type ResaleTransaction = {
  id: string;
  uploaded_by_user_id: string | null;
  property_id: string;
  flat_type_id: number;
  flat_model_id: number;
  storey_range_id: number;
  floor_area_sqm: number;
  transaction_month: string;
  resale_price: number;
};

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

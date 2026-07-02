import { z } from "zod";
import { paginationSchema, idSchema } from "../common";

export const createTransactionSchema = z.object({
  property_id: idSchema,
  flat_type_id: z.coerce.number().int().positive(),
  flat_model_id: z.coerce.number().int().positive(),
  storey_range_id: z.coerce.number().int().positive(),
  floor_area_sqm: z.coerce.number().positive(),
  transaction_month: z.string(),
  resale_price: z.coerce.number().positive(),
});
export const updateTransactionSchema = z
  .object({
    flat_type_id: z.coerce.number().int().positive().optional(),
    flat_model_id: z.coerce.number().int().positive().optional(),
    storey_range_id: z.coerce.number().int().positive().optional(),
    floor_area_sqm: z.coerce.number().positive().optional(),
    transaction_month: z.string().optional(),
    resale_price: z.coerce.number().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });
export const transactionListQuerySchema = paginationSchema.extend({
  town_id: z.uuid().optional(),
  flat_type_id: z.coerce.number().int().positive().optional(),
  flat_model_id: z.coerce.number().int().positive().optional(),
  storey_range_id: z.coerce.number().int().positive().optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
  year: z.coerce.number().int().min(1960).max(2100).optional(),
  property_id: z.uuid().optional(),
});
export const transactionStatisticsMetricSchema = z.enum([
  "avg_price",
  "avg_price_per_sqm",
  "sales_count",
]);
export const transactionStatisticsGranularitySchema = z.enum([
  "monthly",
  "yearly",
  "last 6 months",
]);
export const transactionStatisticsGroupSchema = z.enum([
  "period",
  "town_id",
  "flat_type_id",
  "property_id",
  "lease_remaining_year",
  "storey_range_id",
]);
export const transactionStatisticsQuerySchema = z
  .object({
    metric: transactionStatisticsMetricSchema,
    granularity: transactionStatisticsGranularitySchema,
    groupBy: z.array(transactionStatisticsGroupSchema).min(1),
    date_from: z.coerce.date().optional(),
    date_to: z.coerce.date().optional(),
    town_id: z.uuid().optional(),
    flat_type_id: z.coerce.number().int().positive().optional(),
    property_id: z.uuid().optional(),
    storey_range_id: z.coerce.number().int().positive().optional(),
  })
  .strict()
  .refine((data) => new Set(data.groupBy).size === data.groupBy.length, {
    message: "groupBy values must be unique.",
    path: ["groupBy"],
  });
export const createTransactionParamsSchema = z.object({
  input: createTransactionSchema,
  uploadedByUserId: idSchema,
});
export const updateTransactionParamsSchema = z.object({
  id: idSchema,
  input: updateTransactionSchema.or(z.object({}).strict()),
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

export type TransactionListItem = ResaleTransaction & {
  town_id: string;
  town_name: string;
  block: string;
  street_name: string;
  lease_commence_year: number;
  flat_type_name: string;
  flat_model_name: string;
  min_storey: number;
  max_storey: number;
  uploaded_by_user_name: string | null;
};

export type TransactionStatisticRow = {
  period?: string;
  town_id?: string;
  flat_type_id?: number;
  property_id?: string;
  lease_remaining_year?: number;
  storey_range_id?: number;
  value: number;
  sample_size: number;
};

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type CreateTransactionParams = z.infer<
  typeof createTransactionParamsSchema
>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type UpdateTransactionParams = z.infer<
  typeof updateTransactionParamsSchema
>;
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;
export type TransactionStatisticsMetric = z.infer<
  typeof transactionStatisticsMetricSchema
>;
export type TransactionStatisticsGranularity = z.infer<
  typeof transactionStatisticsGranularitySchema
>;
export type TransactionStatisticsGroup = z.infer<
  typeof transactionStatisticsGroupSchema
>;
export type TransactionStatisticsQuery = z.infer<
  typeof transactionStatisticsQuerySchema
>;

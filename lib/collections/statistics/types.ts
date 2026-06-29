import { z } from "zod";

export const idSchema = z.uuid();

export const metricsSchema = z.enum([
  "town",
  "resale_price",
  "resale_volume",
  "flat_model",
  "flat_type",
]);

export const statisticsGranularitySchema = z.enum(["monthly", "yearly"]);

export const statisticsTimeRangeSchema = z
  .object({
    start: z.string().min(1),
    end: z.string().min(1),
  })
  .strict();

export const statisticsDimensionsSchema = z
  .object({
    town_id: z.uuid().nullable(),
    flat_type_id: z.string().nullable(),
    flat_model_id: z.string().nullable(),
  })
  .strict();

export const statisticsSeriesPointSchema = z
  .object({
    period: z.string().min(1),
    value: z.number(),
    sample_size: z.number().int().min(0),
  })
  .strict();

export const statisticsSearchSchema = z
  .object({
    metric: metricsSchema.optional(),
    dimensions: statisticsDimensionsSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one search field is required",
  });

export const upsertStatisticsSchema = z.object({
  _id: z.uuid().optional(),
  metric: metricsSchema,
  granularity: statisticsGranularitySchema,
  time_range: statisticsTimeRangeSchema,
  dimensions: statisticsDimensionsSchema,
  series: z.array(statisticsSeriesPointSchema),
});

export const statisticsSchema = z.object({
  _id: z.uuid(),
  metric: metricsSchema,
  granularity: statisticsGranularitySchema,
  time_range: statisticsTimeRangeSchema,
  dimensions: statisticsDimensionsSchema,
  series: z.array(statisticsSeriesPointSchema),
  computed_at: z.number().int().min(0),
});

export type StatisticsGranularity = z.infer<typeof statisticsGranularitySchema>;
export type StatisticsTimeRange = z.infer<typeof statisticsTimeRangeSchema>;
export type StatisticsDimensions = z.infer<typeof statisticsDimensionsSchema>;
export type StatisticsSeriesPoint = z.infer<typeof statisticsSeriesPointSchema>;
export type StatisticsUpsert = z.infer<typeof upsertStatisticsSchema>;
export type Statistics = z.infer<typeof statisticsSchema>;
export type StatisticsSearch = z.infer<typeof statisticsSearchSchema>;

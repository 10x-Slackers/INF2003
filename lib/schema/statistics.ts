import { z } from "zod";

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

// dimensions of a statistics series, e.g. town, flat type, flat model
export const statisticsDimensionsSchema = z
  .object({
    town_id: z.uuid().nullable(),
    flat_type_id: z.string().nullable(),
    flat_model_id: z.string().nullable(),
  })
  .strict();

// single point in a statistics series, e.g. a single month or year
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

export const createStatisticsSchema = z
  .object({
    metric: metricsSchema,
    granularity: statisticsGranularitySchema,
    time_range: statisticsTimeRangeSchema,
    dimensions: statisticsDimensionsSchema,
    series: z.array(statisticsSeriesPointSchema),
  })
  .strict();

export const upsertStatisticsSchema = createStatisticsSchema.extend({
  _id: z.uuid(),
});

export const updateStatisticsSchema = z
  .object({
    metric: metricsSchema.optional(),
    granularity: statisticsGranularitySchema.optional(),
    time_range: statisticsTimeRangeSchema.optional(),
    dimensions: statisticsDimensionsSchema.optional(),
    series: z.array(statisticsSeriesPointSchema).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const statisticsSchema = createStatisticsSchema.extend({
  _id: z.uuid(),
  computed_at: z.number().int().min(0),
});

export type StatisticsGranularity = z.infer<typeof statisticsGranularitySchema>;
export type StatisticsTimeRange = z.infer<typeof statisticsTimeRangeSchema>;
export type StatisticsDimensions = z.infer<typeof statisticsDimensionsSchema>;
export type StatisticsSeriesPoint = z.infer<typeof statisticsSeriesPointSchema>;
export type StatisticsCreate = z.infer<typeof createStatisticsSchema>;
export type StatisticsUpsert = z.infer<typeof upsertStatisticsSchema>;
export type StatisticsUpdate = z.infer<typeof updateStatisticsSchema>;
export type Statistics = z.infer<typeof statisticsSchema>;
export type StatisticsSearch = z.infer<typeof statisticsSearchSchema>;

import { z } from "zod";

export const idSchema = z.uuid();

export const metricsSchema = z.enum([
  "town",
  "resalePrice",
  "resaleVolume",
  "flatModel",
  "flatType",
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
    townId: z.uuid().nullable(),
    flatTypeId: z.string().nullable(),
    flatModelId: z.string().nullable(),
  })
  .strict();

export const statisticsSeriesPointSchema = z
  .object({
    period: z.string().min(1),
    value: z.number(),
    sampleSize: z.number().int().min(0),
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
export const statisticsListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(0),
    pageSize: z.coerce.number().int().min(1).max(100),
  })
  .strict();

export const upsertStatisticsSchema = z.object({
  _id: z.uuid().optional(),
  metric: metricsSchema,
  granularity: statisticsGranularitySchema,
  timeRange: statisticsTimeRangeSchema,
  dimensions: statisticsDimensionsSchema,
  series: z.array(statisticsSeriesPointSchema),
});

export const statisticsSchema = z.object({
  _id: z.uuid(),
  metric: metricsSchema,
  granularity: statisticsGranularitySchema,
  timeRange: statisticsTimeRangeSchema,
  dimensions: statisticsDimensionsSchema,
  series: z.array(statisticsSeriesPointSchema),
  computedAt: z.number().int().min(0),
});

export type StatisticsUpsert = z.infer<typeof upsertStatisticsSchema>;
export type Statistics = z.infer<typeof statisticsSchema>;
export type StatisticsListQuery = z.infer<typeof statisticsListQuerySchema>;
export type StatisticsSearch = z.infer<typeof statisticsSearchSchema>;

import { z } from "zod";

export const statisticsTriggerId = "statistics";
export const STATISTICS_TRIGGER_INTERVAL_SECONDS = 24 * 60 * 60; // Currently set to 24 hours

export const statisticsTriggerSchema = z
  .object({
    _id: z.literal(statisticsTriggerId),
    dirtyTownIds: z.array(z.uuid()),
    updatedAt: z.number().int().min(0),
  })
  .strict();

export type StatisticsTrigger = z.infer<typeof statisticsTriggerSchema>;

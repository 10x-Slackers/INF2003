import { db, withMongoError } from "@/lib/db/mongodb";
import { now } from "@/lib/utils";
import { z } from "zod";
import {
  STATISTICS_TRIGGER_INTERVAL_SECONDS,
  statisticsTriggerId,
  statisticsTriggerSchema,
  type StatisticsTrigger,
} from "./types";

const statisticsTriggers =
  db.collection<StatisticsTrigger>("statisticsTriggers");
const townIdSchema = z.uuid();

export async function markStatisticsTownDirty(townId: string): Promise<void> {
  return withMongoError(async () => {
    await statisticsTriggers.updateOne(
      { _id: statisticsTriggerId },
      {
        $addToSet: { dirtyTownIds: townIdSchema.parse(townId) },
        $setOnInsert: { updatedAt: 0 },
      },
      { upsert: true },
    );
  });
}

export async function getStatisticsTrigger(): Promise<StatisticsTrigger> {
  return withMongoError(async () => {
    const trigger = await statisticsTriggers.findOne({
      _id: statisticsTriggerId,
    });

    return trigger
      ? statisticsTriggerSchema.parse(trigger)
      : { _id: statisticsTriggerId, dirtyTownIds: [], updatedAt: 0 };
  });
}

export async function isStatisticsTriggerDue(): Promise<boolean> {
  const trigger = await getStatisticsTrigger();
  return now() - trigger.updatedAt >= STATISTICS_TRIGGER_INTERVAL_SECONDS;
}

export async function flushStatisticsTrigger(): Promise<void> {
  return withMongoError(async () => {
    await statisticsTriggers.updateOne(
      { _id: statisticsTriggerId },
      { $set: { dirtyTownIds: [], updatedAt: now() } },
      { upsert: true },
    );
  });
}

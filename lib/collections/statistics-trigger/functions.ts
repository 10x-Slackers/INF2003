import { db } from "@/lib/db";
import { handleDbError, now } from "@/lib/utils";
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
  try {
    await statisticsTriggers.updateOne(
      { _id: statisticsTriggerId },
      {
        $addToSet: { dirtyTownIds: townIdSchema.parse(townId) },
        $setOnInsert: { updatedAt: 0 },
      },
      { upsert: true },
    );
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getStatisticsTrigger(): Promise<StatisticsTrigger> {
  try {
    const trigger = await statisticsTriggers.findOne({
      _id: statisticsTriggerId,
    });

    return trigger
      ? statisticsTriggerSchema.parse(trigger)
      : { _id: statisticsTriggerId, dirtyTownIds: [], updatedAt: 0 };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function isStatisticsTriggerDue(): Promise<boolean> {
  try {
    const trigger = await getStatisticsTrigger();
    return now() - trigger.updatedAt >= STATISTICS_TRIGGER_INTERVAL_SECONDS;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function flushStatisticsTrigger(): Promise<void> {
  try {
    await statisticsTriggers.updateOne(
      { _id: statisticsTriggerId },
      { $set: { dirtyTownIds: [], updatedAt: now() } },
      { upsert: true },
    );
  } catch (error) {
    return handleDbError(error);
  }
}

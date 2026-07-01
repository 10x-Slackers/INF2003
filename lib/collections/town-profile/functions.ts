import { db } from "@/lib/db";
import { idSchema, type TownProfile } from "./types";
import { handleDbError, now } from "@/lib/utils";

const towns = db.collection<TownProfile>("towns");

export async function listTownProfiles(): Promise<TownProfile[]> {
  try {
    return await towns.find({}).toArray();
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getTownProfileById(
  id: string,
): Promise<TownProfile | null> {
  try {
    return await towns.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function rollDownTownProfileTransaction(
  townId: string,
  flatTypeId: string,
  transactionMonth: string,
): Promise<{ id: string; updatedCount: number; thresholdMet: boolean } | null> {
  try {
    const month = transactionMonth.slice(0, 7);

    const town = await towns.findOneAndUpdate(
      { _id: idSchema.parse(townId) },
      [
        {
          $set: {
            "transactionSummary.totalTransaction": {
              $add: ["$transactionSummary.totalTransaction", 1],
            },
            [`transactionSummary.transactionCountByFlatType.${flatTypeId}`]: {
              $add: [
                {
                  $ifNull: [
                    `$transactionSummary.transactionCountByFlatType.${flatTypeId}`,
                    0,
                  ],
                },
                1,
              ],
            },
            "transactionSummary.earliestTransaction": {
              $cond: [
                { $lt: [month, "$transactionSummary.earliestTransaction"] },
                month,
                "$transactionSummary.earliestTransaction",
              ],
            },
            "transactionSummary.latestTransaction": {
              $cond: [
                { $gt: [month, "$transactionSummary.latestTransaction"] },
                month,
                "$transactionSummary.latestTransaction",
              ],
            },
            updatedAt: now(),
            updatedCount: {
              $cond: [
                {
                  $gte: [{ $add: [{ $ifNull: ["$updatedCount", 0] }, 1] }, 100],
                },
                0,
                { $add: [{ $ifNull: ["$updatedCount", 0] }, 1] },
              ],
            },
          },
        },
      ],
      {
        projection: { _id: 1, updatedCount: 1 },
        returnDocument: "after",
      },
    );
    return town
      ? {
          id: town._id,
          updatedCount: town.updatedCount,
          thresholdMet: town.updatedCount === 0,
        }
      : null;
  } catch (error) {
    return handleDbError(error);
  }
}

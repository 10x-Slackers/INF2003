import { db } from "@/lib/db";
import { idSchema, type TownProfile } from "./types";
import { handleDbError, now } from "@/lib/utils";
import { z } from "zod";

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
  transactionsLast6Months: number,
): Promise<{ id: string; updatedCount: number; thresholdMet: boolean } | null> {
  try {
    const validatedFlatId = z.coerce.number().int().min(1).parse(flatTypeId);
    const validatedTownId = idSchema.parse(townId);
    const validatedTransactionsLast6Months = z.coerce
      .number()
      .int()
      .min(0)
      .parse(transactionsLast6Months);
    const monthschema = z.string().regex(/^\d{4}-\d{2}$/);
    const month = monthschema.parse(transactionMonth.slice(0, 7));

    const town = await towns.findOneAndUpdate(
      { _id: validatedTownId },
      [
        {
          $set: {
            "transactionSummary.totalTransaction": {
              $add: ["$transactionSummary.totalTransaction", 1],
            },
            [`transactionSummary.transactionCountByFlatType.${validatedFlatId}`]:
              {
                $add: [
                  {
                    $ifNull: [
                      `$transactionSummary.transactionCountByFlatType.${validatedFlatId}`,
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
            "transactionSummary.transactionsLast6Months":
              validatedTransactionsLast6Months,
            updatedAt: now(),
            // Increment updatedCount; reset to 0 when threshold is reached
            // to trigger downstream batch processing
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

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
): Promise<{ id: string } | null> {
  try {
    const validatedFlatId = z.coerce.number().int().min(1).parse(flatTypeId);
    const validatedTownId = idSchema.parse(townId);
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
            updatedAt: now(),
          },
        },
      ],
      {
        projection: { _id: 1 },
        returnDocument: "after",
      },
    );
    return town ? { id: town._id } : null;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateTownProfileTransactionsLast6Months(
  townId: string,
  transactionsLast6Months: number,
): Promise<{ id: string } | null> {
  try {
    const town = await towns.findOneAndUpdate(
      { _id: idSchema.parse(townId) },
      {
        $set: {
          "transactionSummary.transactionsLast6Months": z.coerce
            .number()
            .int()
            .min(0)
            .parse(transactionsLast6Months),
          updatedAt: now(),
        },
      },
      {
        projection: { _id: 1 },
        returnDocument: "after",
      },
    );
    return town ? { id: town._id } : null;
  } catch (error) {
    return handleDbError(error);
  }
}

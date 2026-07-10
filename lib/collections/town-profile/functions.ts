import type { AnyBulkWriteOperation } from "mongodb";
import { db, findById } from "@/lib/db";
import { idSchema, type TownProfile } from "./types";
import { withDbError, now } from "@/lib/utils";
import { z } from "zod";

const towns = db.collection<TownProfile>("towns");
const townProfileLast6MonthsUpdateSchema = z.object({
  townId: idSchema,
  transactionsLast6Months: z.coerce.number().int().min(0),
});

export async function listTownProfiles(): Promise<TownProfile[]> {
  return withDbError(async () => {
    return await towns.find({}).toArray();
  });
}

export async function getTownProfileById(
  id: string,
): Promise<TownProfile | null> {
  return findById(towns, idSchema.parse(id));
}

export async function rollDownTownProfileTransaction(
  townId: string,
  flatTypeId: string,
  transactionMonth: string,
): Promise<void> {
  return withDbError(async () => {
    const validatedFlatId = z.coerce.number().int().min(1).parse(flatTypeId);
    const validatedTownId = idSchema.parse(townId);
    const monthschema = z.string().regex(/^\d{4}-\d{2}$/);
    const month = monthschema.parse(transactionMonth.slice(0, 7));

    await towns.findOneAndUpdate({ _id: validatedTownId }, [
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
    ]);
  });
}

export async function bulkUpdateTownProfileTransactionsLast6Months(
  input: { townId: string; transactionsLast6Months: number }[],
): Promise<void> {
  return withDbError(async () => {
    const timestamp = now();
    const operations: AnyBulkWriteOperation<TownProfile>[] = input.map(
      (item) => {
        const data = townProfileLast6MonthsUpdateSchema.parse(item);

        return {
          updateOne: {
            filter: { _id: data.townId },
            update: {
              $set: {
                "transactionSummary.transactionsLast6Months":
                  data.transactionsLast6Months,
                updatedAt: timestamp,
              },
            },
          },
        };
      },
    );

    if (operations.length > 0) {
      await towns.bulkWrite(operations);
    }
  });
}

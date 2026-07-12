import type { AnyBulkWriteOperation } from "mongodb";
import { db, findById, withMongoError } from "@/lib/db/mongodb";
import { idSchema, type TownProfile } from "./types";
import { now } from "@/lib/utils";
import { z } from "zod";

const towns = db.collection<TownProfile>("towns");
const townProfileLast6MonthsUpdateSchema = z.object({
  townId: idSchema,
  transactionsLast6Months: z.coerce.number().int().min(0),
});

export async function listTownProfiles(): Promise<TownProfile[]> {
  return withMongoError(async () => {
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
): Promise<void> {
  return withMongoError(async () => {
    const validatedFlatId = z.coerce.number().int().min(1).parse(flatTypeId);
    const validatedTownId = idSchema.parse(townId);

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
          updatedAt: now(),
        },
      },
    ]);
  });
}

export async function bulkUpdateTownProfileTransactionsLast6Months(
  input: { townId: string; transactionsLast6Months: number }[],
): Promise<void> {
  return withMongoError(async () => {
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

import {
  isStatisticsTriggerDue,
  markStatisticsTownDirty,
} from "@/lib/collections/statistics-trigger";
import { rollDownTownProfileTransaction } from "@/lib/collections/town-profile";
import { createTransaction } from "@/lib/tables/transactions";

import { handleDbError } from "../utils";
import { createAlerts } from "./alerts";
import { runStatisticsTrigger, updatePropertyStatistic } from "./statistics";
import { AddTransactionInput } from "./types";

export async function addTransaction(
  transaction: AddTransactionInput,
): Promise<{ id: string } | null> {
  const flatTypeId = parseInt(transaction.flatTypeId, 10);
  const flatModelId = parseInt(transaction.flatModelId, 10);
  const params = {
    uploadedByUserId: transaction.userId,
    input: {
      property_id: transaction.propertyId,
      flat_type_id: flatTypeId,
      flat_model_id: flatModelId,
      storey_range_id: transaction.storeyRangeId,
      floor_area_sqm: transaction.floorAreaSqm,
      transaction_month: transaction.transactionDate,
      resale_price: transaction.resalePrice,
    },
  };
  try {
    // Create the transaction and get the transaction ID
    const transactionId = await createTransaction(params);

    // Roll down town profile transaction
    const town = await rollDownTownProfileTransaction(
      transaction.townId,
      transaction.flatTypeId,
      transaction.transactionDate,
    );

    await markStatisticsTownDirty(transaction.townId);
    await updatePropertyStatistic(transaction.propertyId);
    if (await isStatisticsTriggerDue()) {
      await runStatisticsTrigger();
    }
    await createAlerts(transactionId, transaction);

    return town;
  } catch (error) {
    return handleDbError(error);
  }
}

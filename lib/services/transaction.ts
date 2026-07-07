import {
  rollDownTownProfileTransaction,
  updateTownProfileTransactionsLast6Months,
} from "@/lib/collections/town-profile";
import {
  createTransaction,
  getTransactionStatistics,
} from "@/lib/tables/transactions";

import {
  transactionStatisticsMetricSchema,
  transactionStatisticsGranularitySchema,
} from "@/lib/tables/transactions/types";
import { handleDbError } from "../utils";
import { createAlerts } from "./alerts";
import { AddTransactionInput } from "./types";

export async function addTransaction(
  transaction: AddTransactionInput,
): Promise<{ id: string; updatedCount: number; thresholdMet: boolean } | null> {
  const flatTypeId = parseInt(transaction.flatTypeId);
  const params = {
    uploadedByUserId: transaction.user_id,
    input: {
      property_id: transaction.propertyId,
      flat_type_id: flatTypeId,
      flat_model_id: parseInt(transaction.flatModelId),
      storey_range_id: transaction.storeyRangeId,
      floor_area_sqm: transaction.floorAreaSqm,
      transaction_month: transaction.transactionDate,
      resale_price: transaction.resalePrice,
    },
  };
  try {
    // Create the transaction and get the transaction ID
    const transactionId = await createTransaction(params);
    // create alerts for transaction
    await createAlerts(transactionId, transaction);

    // Roll down town profile transaction and update transactions last 6 months
    const town = await rollDownTownProfileTransaction(
      transaction.townId,
      transaction.flatTypeId,
      transaction.transactionDate,
    );
    if (!town?.thresholdMet) return town;
    const transactionsLast6Months = await countTownTransactionsLast6Months(
      transaction.townId,
    );
    const updatedTown = await updateTownProfileTransactionsLast6Months(
      transaction.townId,
      transactionsLast6Months,
    );
    return updatedTown;
  } catch (error) {
    return handleDbError(error);
  }
}

async function countTownTransactionsLast6Months(townId: string) {
  try {
    const [row] = await getTransactionStatistics({
      metric: transactionStatisticsMetricSchema.enum.sales_count,
      granularity: transactionStatisticsGranularitySchema.enum["last 6 months"],
      groupBy: ["town_id"],
      town_id: townId,
    });
    return row?.value ?? 0;
  } catch (error) {
    return handleDbError(error);
  }
}

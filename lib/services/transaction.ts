import { rollDownTownProfileTransaction } from "@/lib/collections/town-profile";
import {
  createTransaction,
  getTransactionStatistics,
  type CreateTransactionParams,
} from "@/lib/tables/transactions";

import {
  transactionStatisticsMetricSchema,
  transactionStatisticsGranularitySchema,
} from "@/lib/tables/transactions/types";
import { handleDbError } from "../utils";

type AddTransactionInput = {
  user_id: string;
  townId: string;
  flatTypeId: string;
  flatModelId: string;
  propertyId: string;
  storeyRangeId: number;
  transactionDate: string;
  resalePrice: number;
  floorAreaSqm: number;
};

export async function addTransaction(
  transaction: AddTransactionInput,
): Promise<{ id: string; updatedCount: number; thresholdMet: boolean } | null> {
  const params: CreateTransactionParams = {
    uploadedByUserId: transaction.user_id,
    input: {
      property_id: transaction.propertyId,
      flat_type_id: parseInt(transaction.flatTypeId),
      flat_model_id: parseInt(transaction.flatModelId),
      storey_range_id: transaction.storeyRangeId,
      floor_area_sqm: transaction.floorAreaSqm,
      transaction_month: transaction.transactionDate,
      resale_price: transaction.resalePrice,
    },
  };
  try {
    // transaction id is not needed for roll down, so we can ignore the return value
    await createTransaction(params);
    const transactionsLast6Months = await countTownTransactionsLast6Months(
      transaction.townId,
    );
    return rollDownTownProfileTransaction(
      transaction.townId,
      transaction.flatTypeId,
      transaction.transactionDate,
      transactionsLast6Months,
    );
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

import {
  rollDownTownProfileTransaction,
  updateTownProfileTransactionsLast6Months,
} from "@/lib/collections/town-profile";
import { query } from "@/lib/db";
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
import {
  findAlertsByTransaction,
  triggerSavedAlerts,
} from "../collections/saved-alerts/functions";
import { bulkCreateAlertNotifications } from "../tables/alert-notifications/functions";

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
  const flatTypeId = parseInt(transaction.flatTypeId);
  const params: CreateTransactionParams = {
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
    const transactionId = await createTransaction(params);
    const alerts = await fetchSavedAlerts(transaction);
    await bulkCreateAlertNotifications(
      alerts.map((alert) => ({
        userId: alert.userId,
        alert_uuid: alert.alertId,
        transaction_id: transactionId,
      })),
    );
    await triggerSavedAlerts(alerts.map((alert) => alert.alertId));
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

async function fetchSavedAlerts(transaction: AddTransactionInput) {
  try {
    const storey = await getStoreyRange(transaction.storeyRangeId);
    const alerts = await findAlertsByTransaction({
      townId: transaction.townId,
      flatTypeId: parseInt(transaction.flatTypeId),
      flatModelId: parseInt(transaction.flatModelId),
      price: transaction.resalePrice,
      floorAreaSqm: transaction.floorAreaSqm,
      storey,
    });

    return alerts;
  } catch (error) {
    return handleDbError(error);
  }
}

async function getStoreyRange(storeyRangeId: number) {
  const [range] = await query<{ min_storey: number; max_storey: number }>(
    "SELECT min_storey, max_storey FROM storey_ranges WHERE id = ? LIMIT 1",
    [storeyRangeId],
  );
  return { min: range.min_storey, max: range.max_storey };
}

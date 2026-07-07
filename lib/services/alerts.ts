import {
  findAlertsByTransaction,
  triggerSavedAlerts,
} from "../collections/saved-alerts/functions";
import { bulkCreateAlertNotifications } from "../tables/alert-notifications/functions";
import { getStoreyRange } from "../tables/lookups";
import { handleDbError } from "../utils";
import { AddTransactionInput } from "./types";

export async function createAlerts(
  transactionId: string,
  transaction: AddTransactionInput,
) {
  const alerts = await fetchSavedAlerts(transaction);
  await Promise.all([
    bulkCreateAlertNotifications(
      alerts.map((alert) => ({
        userId: alert.userId,
        alert_uuid: alert.alertId,
        transaction_id: transactionId,
      })),
    ),
    triggerSavedAlerts(alerts.map((alert) => alert.alertId)),
  ]);
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
      leaseRemaining: calculateLeaseRemaining(
        transaction.transactionDate,
        transaction.leaseCommenceYear,
      ),
    });

    return alerts;
  } catch (error) {
    return handleDbError(error);
  }
}

function calculateLeaseRemaining(
  transactionDate: string,
  leaseCommenceYear: string,
) {
  const yearsUsed =
    Number(transactionDate.slice(0, 4)) - Number(leaseCommenceYear);
  return Math.max(0, Math.min(99, 99 - yearsUsed));
}

import {
  findAlertsByTransaction,
  triggerSavedAlerts,
} from "../collections/saved-alerts";
import { bulkCreateAlertNotifications } from "../tables/alert-notifications";
import { getStoreyRange } from "../tables/lookups";
import { AddTransactionInput } from "./types";

const MAX_LEASE_YEARS = 99;

export async function createAlerts(
  transactionId: string,
  transaction: AddTransactionInput,
): Promise<void> {
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

async function fetchSavedAlerts(
  transaction: AddTransactionInput,
): Promise<{ userId: string; alertId: string }[]> {
  const storey = await getStoreyRange(transaction.storeyRangeId);
  const alerts = await findAlertsByTransaction({
    townId: transaction.townId,
    flatTypeId: parseInt(transaction.flatTypeId, 10),
    flatModelId: parseInt(transaction.flatModelId, 10),
    price: transaction.resalePrice,
    floorAreaSqm: transaction.floorAreaSqm,
    storey,
    leaseRemaining: calculateLeaseRemaining(
      transaction.transactionDate,
      transaction.leaseCommenceYear,
    ),
  });
  return alerts;
}

function calculateLeaseRemaining(
  transactionDate: string,
  leaseCommenceYear: string,
): number {
  const yearsUsed =
    Number(transactionDate.slice(0, 4)) - Number(leaseCommenceYear);
  return Math.max(0, Math.min(MAX_LEASE_YEARS, MAX_LEASE_YEARS - yearsUsed));
}

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
  townId: string,
  leaseCommenceYear: number,
): Promise<void> {
  const alerts = await fetchSavedAlerts(transaction, townId, leaseCommenceYear);
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
  townId: string,
  leaseCommenceYear: number,
): Promise<{ userId: string; alertId: string }[]> {
  const storey = await getStoreyRange(transaction.input.storey_range_id);
  const alerts = await findAlertsByTransaction({
    townId,
    flatTypeId: transaction.input.flat_type_id,
    flatModelId: transaction.input.flat_model_id,
    price: transaction.input.resale_price,
    floorAreaSqm: transaction.input.floor_area_sqm,
    storey,
    leaseRemaining: calculateLeaseRemaining(
      transaction.input.transaction_month,
      leaseCommenceYear,
    ),
  });
  return alerts;
}

function calculateLeaseRemaining(
  transactionMonth: string,
  leaseCommenceYear: number,
): number {
  const yearsUsed = Number(transactionMonth.slice(0, 4)) - leaseCommenceYear;
  return Math.max(0, Math.min(MAX_LEASE_YEARS, MAX_LEASE_YEARS - yearsUsed));
}

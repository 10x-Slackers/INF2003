import {
  isStatisticsTriggerDue,
  markStatisticsTownDirty,
} from "@/lib/collections/statistics-trigger";
import { rollDownTownProfileTransaction } from "@/lib/collections/town-profile";
import { createTransaction } from "@/lib/tables/transactions";
import { getPropertyRowById } from "@/lib/tables/properties";

import { createAlerts } from "./alerts";
import { refreshPropertyStats, syncStats } from "./statistics";
import { AddTransactionInput } from "./types";

export async function addTransaction(
  transaction: AddTransactionInput,
): Promise<void> {
  const { uploadedByUserId, input } = transaction;
  const property = await getPropertyRowById(input.property_id);
  if (!property) throw new Error("Property not found");

  const transactionId = await createTransaction({ input, uploadedByUserId });

  const townProfilePipeline = rollDownTownProfileTransaction(
    property.town_id,
    String(input.flat_type_id),
  );
  const statisticsPipeline = (async () => {
    await Promise.all([
      markStatisticsTownDirty(property.town_id),
      refreshPropertyStats(input.property_id),
    ]);
    if (await isStatisticsTriggerDue()) {
      await syncStats();
    }
  })();
  const alertPipeline = createAlerts(
    transactionId,
    transaction,
    property.town_id,
    property.lease_commence_year,
  );
  const results = await Promise.allSettled([
    townProfilePipeline,
    statisticsPipeline,
    alertPipeline,
  ]);
  if (results.some((result) => result.status === "rejected")) {
    console.warn(
      "Transaction created but derived data refresh failed",
      results,
    );
  }
}

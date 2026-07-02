import { rollDownTownProfileTransaction } from "@/lib/collections/town-profile";
import {
  createTransaction,
  type CreateTransactionParams,
} from "@/lib/tables/transactions";

type AddTransactionInput = {
  user_id: string;
  townId: string;
  flatTypeId: string;
  flatModelId: string;
  propertyId: string;
  leaseRemaining: number | null;
  storeyRangeId: number;
  storeyLabel: string | null;
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
  await createTransaction(params);
  return TownProfileTransaction(
    transaction.townId,
    transaction.flatTypeId,
    transaction.transactionDate,
  );
}

async function TownProfileTransaction(
  townId: string,
  flatTypeId: string,
  transactionMonth: string,
): Promise<{ id: string; updatedCount: number; thresholdMet: boolean } | null> {
  const townProfile = await rollDownTownProfileTransaction(
    townId,
    flatTypeId,
    transactionMonth,
  );
  return townProfile;
}

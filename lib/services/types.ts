export type AddTransactionInput = {
  user_id: string;
  townId: string;
  flatTypeId: string;
  flatModelId: string;
  propertyId: string;
  storeyRangeId: number;
  transactionDate: string;
  resalePrice: number;
  floorAreaSqm: number;
  leaseCommenceYear: string;
};

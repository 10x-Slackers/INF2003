import type { ReactNode } from "react";

export type PlaceholderProperty = {
  id: string;
  town: string;
  block: string;
  streetName: string;
  leaseCommenceYear: number;
};

export type AlertMetric =
  | "resalePrice"
  | "floorAreaSqm"
  | "leaseCommenceYear"
  | "flatType"
  | "flatModel"
  | "storeyRange";

export type PropertyAlert = {
  id: string;
  propertyId: string;
  metric: AlertMetric;
  matchValue: string;
  minValue: string;
  maxValue: string;
  isActive: boolean;
  createdAt: string;
};

export type PlaceholderTransaction = {
  id: string;
  propertyId: string;
  town: string;
  flatType: string;
  flatModel: string;
  storeyRange: string;
  floorAreaSqm: string;
  month: string;
  price: string;
};

export type TransactionDraft = {
  propertyId: string;
  flatTypeId: string;
  flatModelId: string;
  storeyRangeId: string;
  floorAreaSqm: string;
  transactionMonth: string;
  resalePrice: string;
};

export type PlaceholderTableColumn<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
};

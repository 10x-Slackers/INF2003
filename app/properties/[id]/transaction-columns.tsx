import type { DataTableColumn } from "@/components/dashboard/DataTable";
import type { TransactionListItem } from "@/lib/tables/transactions";

const pad = (value: number) => String(value).padStart(2, "0");

export const transactionColumns = [
  {
    key: "transactionMonth",
    header: "Transaction Month",
    cell: (row) =>
      new Date(row.transaction_month).toLocaleDateString("en-SG", {
        month: "short",
        year: "numeric",
      }),
  },
  { key: "flatType", header: "Flat Type", cell: (row) => row.flat_type_name },
  {
    key: "flatModel",
    header: "Flat Model",
    cell: (row) => row.flat_model_name,
  },
  {
    key: "storeyRange",
    header: "Storey Range",
    cell: (row) => `${pad(row.min_storey)} To ${pad(row.max_storey)}`,
  },
  {
    key: "floorAreaSqm",
    header: "Floor Area",
    cell: (row) => `${row.floor_area_sqm} sqm`,
  },
  {
    key: "resalePrice",
    header: "Resale Price",
    cell: (row) =>
      row.resale_price.toLocaleString("en-SG", {
        currency: "SGD",
        style: "currency",
        maximumFractionDigits: 0,
      }),
  },
] satisfies DataTableColumn<TransactionListItem>[];

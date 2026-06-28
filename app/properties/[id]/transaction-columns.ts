import type { DataTableColumn } from "@/components/dashboard/DataTable";
import type { resaleTransactionType } from "@/lib/placeholder";

export const transactionColumns = [
  {
    key: "transactionMonth",
    header: "Transaction Month",
    cell: (row) =>
      new Date(row.transactionMonth).toLocaleDateString("en-SG", {
        month: "short",
        year: "numeric",
      }),
  },
  { key: "flatType", header: "Flat Type", cell: (row) => row.flatType },
  { key: "flatModel", header: "Flat Model", cell: (row) => row.flatModel },
  {
    key: "storeyRange",
    header: "Storey Range",
    cell: (row) => row.storeyRange,
  },
  {
    key: "floorAreaSqm",
    header: "Floor Area",
    cell: (row) => `${row.floorAreaSqm} sqm`,
  },
  {
    key: "resalePrice",
    header: "Resale Price",
    cell: (row) =>
      row.resalePrice.toLocaleString("en-SG", {
        currency: "SGD",
        style: "currency",
      }),
  },
] satisfies DataTableColumn<resaleTransactionType>[];

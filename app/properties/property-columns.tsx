import Link from "next/link";
import type { DataTableColumn } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import type { PropertyListItem } from "@/lib/tables/properties";
import { ROUTES } from "@/lib/routes";

export const propertyColumns = [
  { key: "town", header: "Town", cell: (row) => row.town_name },
  {
    key: "flatType",
    header: "Flat Type",
    cell: (row) => row.latest_transaction?.flat_type ?? "-",
  },
  {
    key: "flatModel",
    header: "Flat Model",
    cell: (row) => row.latest_transaction?.flat_model ?? "-",
  },
  {
    key: "streetName",
    header: "Street Name",
    cell: (row) => row.street_name,
  },
  {
    key: "lastTransactionDate",
    header: "Last Transaction",
    cell: (row) =>
      row.latest_transaction
        ? new Date(row.latest_transaction.transaction_month).toLocaleDateString(
            "en-SG",
            {
              month: "short",
              year: "numeric",
            },
          )
        : "-",
  },
  {
    key: "resalePrice",
    header: "Resale Price",
    cell: (row) =>
      row.latest_transaction
        ? row.latest_transaction.resale_price.toLocaleString("en-SG", {
            currency: "SGD",
            style: "currency",
          })
        : "-",
  },
  {
    key: "details",
    header: "Details",
    cell: (row) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`${ROUTES.PROPERTIES}/${row.id}`}>View</Link>
      </Button>
    ),
  },
] satisfies DataTableColumn<PropertyListItem>[];

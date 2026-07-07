import Link from "next/link";
import type { DataTableColumn } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import type { PropertyWithLatestTransaction } from "@/lib/tables/properties";
import { ROUTES } from "@/lib/routes";

export type PropertyRow = PropertyWithLatestTransaction & {
  town_name: string;
};

export const propertyColumns = [
    { key: "town", header: "Town", cell: (row) => row.town_name },
    { key: "block", header: "Block", cell: (row) => row.block },
    {
      key: "streetName",
      header: "Street Name",
      cell: (row) => row.street_name,
    },
    {
      key: "leaseCommenceYear",
      header: "Lease Commence Year",
      cell: (row) => row.lease_commence_year,
    },
    {
      key: "resalePrice",
      header: "Latest Resale Price",
      cell: (row) =>
        row.latest_transaction
          ? row.latest_transaction.resale_price.toLocaleString("en-SG", {
              currency: "SGD",
              style: "currency",
              maximumFractionDigits: 0,
            })
          : "—",
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
  ] satisfies DataTableColumn<PropertyRow>[];

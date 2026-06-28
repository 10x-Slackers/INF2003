import Link from "next/link";
import type { DataTableColumn } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import type { propertyType } from "@/lib/placeholder";
import { ROUTES } from "@/lib/routes";

export const propertyColumns = [
  { key: "town", header: "Town", cell: (row) => row.town },
  { key: "flatType", header: "Flat Type", cell: (row) => row.flatType },
  { key: "flatModel", header: "Flat Model", cell: (row) => row.flatModel },
  { key: "block", header: "Block", cell: (row) => row.block },
  { key: "streetName", header: "Street Name", cell: (row) => row.streetName },
  {
    key: "leaseCommenceYear",
    header: "Lease Commence Year",
    cell: (row) => row.leaseCommenceYear,
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
  {
    key: "details",
    header: "Details",
    cell: (row) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`${ROUTES.PROPERTIES}/${row.id}`}>View</Link>
      </Button>
    ),
  },
] satisfies DataTableColumn<propertyType>[];

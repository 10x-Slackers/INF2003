import { Suspense } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesTable } from "./properties-table";
import { flatTypes, flatModels, properties } from "@/lib/placeholder";
import { DataTableColumn } from "@/components/dashboard/DataTable";
import type { propertyType } from "@/lib/placeholder";

export default function PropertiesPage() {
  return (
    <main className="container mx-auto px-5 py-6">
      <Suspense fallback={<PropertiesSkeleton />}>
        <Properties />
      </Suspense>
    </main>
  );
}

const propertyColumns = [
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
] satisfies DataTableColumn<propertyType>[];

async function Properties() {
  // database call to fetch metrics data goes here
  return (
    <PropertiesTable
      flatModels={flatModels}
      flatTypes={flatTypes}
      properties={properties}
    />
  );
}

function PropertiesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <Skeleton className="h-14 min-w-40 flex-1" />
          <Skeleton className="h-14 min-w-40 flex-1" />
          <Skeleton className="h-14 min-w-40 flex-1" />
          <Skeleton className="h-14 min-w-40 flex-1" />
          <Skeleton className="h-8 min-w-24 flex-1" />
          <Skeleton className="h-8 min-w-24 flex-1" />
        </div>
        <DataTable columns={propertyColumns} data={[]} skeletonRows={2} />
        <Skeleton className="mx-auto h-8 w-64" />
      </CardContent>
    </Card>
  );
}

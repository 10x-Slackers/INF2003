import { Suspense } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesTable } from "./properties-table";
import {
  flatTypes,
  flatModels,
  listPlaceholderProperties,
} from "@/lib/placeholder";
import { propertyColumns } from "./property-columns";

const pageSize = 2;

type PropertiesPageProps = {
  searchParams: Promise<{
    flatModelId?: string;
    flatTypeId?: string;
    maxPrice?: string;
    minPrice?: string;
    page?: string;
  }>;
};

export default function PropertiesPage({ searchParams }: PropertiesPageProps) {
  return (
    <main className="container mx-auto px-5 py-6">
      <Suspense fallback={<PropertiesSkeleton />}>
        <Properties searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Properties({
  searchParams,
}: {
  searchParams: PropertiesPageProps["searchParams"];
}) {
  const query = await searchParams;
  const page = getPositiveNumber(query.page) ?? 1;
  const minPrice = getPositiveNumber(query.minPrice);
  const maxPrice = getPositiveNumber(query.maxPrice);
  const filters = {
    flatModelId: getFilterValue(query.flatModelId),
    flatTypeId: getFilterValue(query.flatTypeId),
    maxPrice,
    minPrice,
  };
  // this is a placeholder for fetching data from the database (remember to await)
  const results = listPlaceholderProperties({
    ...filters,
    page,
    pageSize,
  });
  const pageCount = Math.max(1, Math.ceil(results.total / pageSize));

  return (
    <PropertiesTable
      currentPage={Math.min(page, pageCount)}
      flatModels={flatModels}
      flatTypes={flatTypes}
      filters={{
        flatModelId: filters.flatModelId ?? "all",
        flatTypeId: filters.flatTypeId ?? "all",
        maxPrice: maxPrice === undefined ? "" : String(maxPrice),
        minPrice: minPrice === undefined ? "" : String(minPrice),
      }}
      pageCount={pageCount}
      properties={results.data}
    />
  );
}

function getFilterValue(value?: string) {
  return value && value !== "all" ? value : undefined;
}

function getPositiveNumber(value?: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
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

import { Suspense } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesTable } from "./properties-table";
import { listFlatModels, listFlatTypes } from "@/lib/tables/lookups";
import {
  listProperties,
  type PropertyListQuery,
} from "@/lib/tables/properties";
import { listTowns } from "@/lib/tables/towns";
import { propertyColumns } from "./property-columns";

const pageSize = 50;

type PropertiesPageProps = {
  searchParams: Promise<{
    flatModelId?: string;
    flatTypeId?: string;
    maxPrice?: string;
    minPrice?: string;
    page?: string;
    townId?: string;
  }>;
};

export default function PropertiesPage({ searchParams }: PropertiesPageProps) {
  return (
    <main className="container mx-auto px-6 py-8">
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
  const flatModelId = getPositiveNumber(query.flatModelId);
  const flatTypeId = getPositiveNumber(query.flatTypeId);
  const townId = getSelectValue(query.townId);
  const propertyFilters = {
    flat_model_id: flatModelId,
    flat_type_id: flatTypeId,
    price_max: maxPrice,
    price_min: minPrice,
    town_id: townId === "all" ? undefined : townId,
  } satisfies Omit<PropertyListQuery, "page" | "pageSize">;
  const filters = new URLSearchParams();
  if (flatModelId !== undefined)
    filters.set("flatModelId", String(flatModelId));
  if (flatTypeId !== undefined) filters.set("flatTypeId", String(flatTypeId));
  if (maxPrice !== undefined) filters.set("maxPrice", String(maxPrice));
  if (minPrice !== undefined) filters.set("minPrice", String(minPrice));
  if (townId !== "all") filters.set("townId", townId);
  const [initialResults, flatTypes, flatModels, towns] = await Promise.all([
    listProperties({
      ...propertyFilters,
      page,
      pageSize,
    }),
    listFlatTypes(),
    listFlatModels(),
    listTowns({ page: 1, pageSize: 100 }),
  ]);
  let results = initialResults;
  const pageCount = Math.max(1, Math.ceil(results.total / pageSize));
  const currentPage = Math.min(page, pageCount);

  if (currentPage !== page) {
    results = await listProperties({
      ...propertyFilters,
      page: currentPage,
      pageSize,
    });
  }

  return (
    <PropertiesTable
      currentPage={currentPage}
      flatModels={flatModels}
      flatTypes={flatTypes}
      filters={filters}
      pageCount={pageCount}
      properties={results.data}
      towns={towns.data}
    />
  );
}

function getPositiveNumber(value?: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function getSelectValue(value?: string) {
  return value && value !== "all" ? value : "all";
}

function PropertiesSkeleton() {
  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <Skeleton className="h-14 min-w-40 flex-1" />
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

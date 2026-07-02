import { Suspense } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesTable } from "./properties-table";
import { listProperties } from "@/lib/tables/properties";
import { listTowns } from "@/lib/tables/towns";
import { propertyColumns } from "./property-columns";

const pageSize = 50;

type PropertiesPageProps = {
  searchParams: Promise<{
    townId?: string;
    leaseCommenceYear?: string;
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
  const leaseCommenceYear = getPositiveNumber(query.leaseCommenceYear);
  const filters = {
    townId: getFilterValue(query.townId),
    leaseCommenceYear,
    maxPrice,
    minPrice,
  };

  const [results, townsResult] = await Promise.all([
    listProperties({
      page,
      pageSize,
      town_id: filters.townId,
      lease_commence_year: leaseCommenceYear,
      price_min: minPrice,
      price_max: maxPrice,
    }),
    listTowns({ page: 1, pageSize: 100 }),
  ]);
  const pageCount = Math.max(1, Math.ceil(results.total / pageSize));
  const townNameById = new Map(
    townsResult.data.map((town) => [town.id, town.name]),
  );

  return (
    <PropertiesTable
      currentPage={Math.min(page, pageCount)}
      towns={townsResult.data}
      filters={{
        townId: filters.townId ?? "all",
        leaseCommenceYear:
          leaseCommenceYear === undefined ? "" : String(leaseCommenceYear),
        maxPrice: maxPrice === undefined ? "" : String(maxPrice),
        minPrice: minPrice === undefined ? "" : String(minPrice),
      }}
      pageCount={pageCount}
      properties={results.data.map((property) => ({
        ...property,
        town_name: townNameById.get(property.town_id) ?? "—",
      }))}
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

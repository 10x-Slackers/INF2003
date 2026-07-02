import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SavePropertyButton } from "@/components/save-property-button";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import {
  getPropertiesWithLatestTransaction,
  getPropertyById,
} from "@/lib/tables/properties";
import { isPropertySaved } from "@/lib/tables/saved-properties";
import {
  getPropertyFilterOptions,
  getTransactionPriceStats,
  listTransactions,
} from "@/lib/tables/transactions";
import { transactionColumns } from "./transaction-columns";
import { PropertyTransactionsTable } from "./transactions-table";

type PropertyPageQuery = {
  transactionPage?: string;
  from?: string;
  flatTypeId?: string;
  flatModelId?: string;
  storeyRangeId?: string;
  year?: string;
};

type PropertyPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<PropertyPageQuery>;
};

const pageSize = 10;

export default async function PropertyPage({
  params,
  searchParams,
}: PropertyPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const transactionPage = Number(query.transactionPage ?? "1");
  const from = query.from === "bookmarks" ? "bookmarks" : undefined;

  return (
    <main className="container mx-auto flex flex-col gap-4 px-5 py-6">
      <Button asChild className="self-start" variant="outline">
        <Link
          href={from === "bookmarks" ? ROUTES.BOOKMARKS : ROUTES.PROPERTIES}
        >
          Back to {from === "bookmarks" ? "bookmarks" : "properties"}
        </Link>
      </Button>
      <Suspense fallback={<PropertySkeleton />}>
        <Property
          id={id}
          from={from}
          transactionPage={
            Number.isFinite(transactionPage) && transactionPage > 0
              ? Math.floor(transactionPage)
              : 1
          }
          query={query}
        />
      </Suspense>
    </main>
  );
}

async function Property({
  id,
  transactionPage,
  from,
  query,
}: {
  id: string;
  transactionPage: number;
  from?: "bookmarks";
  query: PropertyPageQuery;
}) {
  const filters = {
    flatTypeId: getFilterValue(query.flatTypeId),
    flatModelId: getFilterValue(query.flatModelId),
    storeyRangeId: getFilterValue(query.storeyRangeId),
    year: getPositiveNumber(query.year),
  };

  const [
    session,
    property,
    [propertyWithLatest],
    transactionsResult,
    priceStats,
    filterOptions,
  ] = await Promise.all([
    auth(),
    getPropertyById(id),
    getPropertiesWithLatestTransaction([id]),
    listTransactions({
      property_id: id,
      page: transactionPage,
      pageSize,
      flat_type_id: filters.flatTypeId ? Number(filters.flatTypeId) : undefined,
      flat_model_id: filters.flatModelId
        ? Number(filters.flatModelId)
        : undefined,
      storey_range_id: filters.storeyRangeId
        ? Number(filters.storeyRangeId)
        : undefined,
      year: filters.year,
    }),
    getTransactionPriceStats(id),
    getPropertyFilterOptions(id),
  ]);

  if (!property) {
    notFound();
  }

  const saved = session?.user
    ? await isPropertySaved({ userId: session.user.id, propertyId: id })
    : false;
  const latestTransaction = propertyWithLatest?.latest_transaction ?? null;
  const pageCount = Math.max(1, Math.ceil(transactionsResult.total / pageSize));
  const currentPage = Math.min(transactionPage, pageCount);

  return (
    <>
      <Card size="sm">
        <CardHeader>
          <CardTitle>
            Block {property.block}, {property.street_name}
            <span className="text-muted-foreground">
              {" "}
              · {property.town?.name} · Lease Commence Year{" "}
              {property.lease_commence_year}
            </span>
          </CardTitle>
          <CardAction>
            <SavePropertyButton initialSaved={saved} propertyId={id} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <CardTitle className="w-full">Latest Transaction</CardTitle>
          <PropertyField
            label="Flat Type"
            value={latestTransaction?.flat_type ?? "—"}
          />
          <PropertyField
            label="Flat Model"
            value={latestTransaction?.flat_model ?? "—"}
          />
          <PropertyField
            label="Resale Price"
            value={
              latestTransaction
                ? latestTransaction.resale_price.toLocaleString("en-SG", {
                    currency: "SGD",
                    style: "currency",
                  })
                : "—"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <PropertyField
              label="Avg Price/sqm"
              value={formatPricePerSqm(priceStats?.avg_price_per_sqm)}
            />
            <PropertyField
              label="Lowest Price/sqm"
              value={formatPricePerSqm(priceStats?.min_price_per_sqm)}
            />
            <PropertyField
              label="Highest Price/sqm"
              value={formatPricePerSqm(priceStats?.max_price_per_sqm)}
            />
          </div>
          <PropertyField
            label="Available Flat Types"
            value={
              filterOptions.flatTypes
                .map((flatType) => flatType.name)
                .join(", ") || "—"
            }
          />
          <PropertyField
            label="Available Flat Models"
            value={
              filterOptions.flatModels
                .map((flatModel) => flatModel.name)
                .join(", ") || "—"
            }
          />
        </CardContent>
      </Card>

      <PropertyTransactionsTable
        currentPage={currentPage}
        filters={{
          flatTypeId: filters.flatTypeId ?? "all",
          flatModelId: filters.flatModelId ?? "all",
          storeyRangeId: filters.storeyRangeId ?? "all",
          year: filters.year === undefined ? "" : String(filters.year),
        }}
        flatModels={filterOptions.flatModels}
        flatTypes={filterOptions.flatTypes}
        from={from}
        pageCount={pageCount}
        propertyId={id}
        storeyRanges={filterOptions.storeyRanges}
        total={transactionsResult.total}
        transactions={transactionsResult.data}
      />
    </>
  );
}

function getFilterValue(value?: string) {
  return value && value !== "all" ? value : undefined;
}

function getPositiveNumber(value?: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function formatPricePerSqm(value: number | undefined) {
  if (value === undefined) return "—";
  const price = Math.round(value).toLocaleString("en-SG", {
    currency: "SGD",
    style: "currency",
    maximumFractionDigits: 0,
  });
  return `${price}/sqm`;
}

function PropertyField({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex min-w-40 flex-1 flex-col gap-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-80" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Skeleton className="h-12 min-w-40 flex-1" />
          <Skeleton className="h-12 min-w-40 flex-1" />
          <Skeleton className="h-12 min-w-40 flex-1" />
          <Skeleton className="h-12 min-w-40 flex-1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={transactionColumns} data={[]} skeletonRows={2} />
          <Skeleton className="mx-auto mt-4 h-8 w-64" />
        </CardContent>
      </Card>
    </>
  );
}

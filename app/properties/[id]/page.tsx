import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { PaginatedDataTable } from "@/components/dashboard/PaginatedDataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { listTransactions } from "@/lib/tables/transactions";
import { transactionColumns } from "./transaction-columns";

type PropertyPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ transactionPage?: string; from?: string }>;
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
        />
      </Suspense>
    </main>
  );
}

async function Property({
  id,
  transactionPage,
  from,
}: {
  id: string;
  transactionPage: number;
  from?: "bookmarks";
}) {
  const [session, property, [propertyWithLatest], transactionsResult] =
    await Promise.all([
      auth(),
      getPropertyById(id),
      getPropertiesWithLatestTransaction([id]),
      listTransactions({ property_id: id, page: transactionPage, pageSize }),
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
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {transactionsResult.total} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaginatedDataTable
            columns={transactionColumns}
            currentPage={currentPage}
            data={transactionsResult.data}
            emptyMessage="No transactions found."
            getPageHref={(page) =>
              `${ROUTES.PROPERTIES}/${id}?transactionPage=${page}${from ? `&from=${from}` : ""}`
            }
            getRowKey={(transaction) => transaction.id}
            pageCount={pageCount}
          />
        </CardContent>
      </Card>
    </>
  );
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

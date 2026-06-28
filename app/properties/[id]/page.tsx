import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { PaginatedDataTable } from "@/components/dashboard/PaginatedDataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { properties, resaleTransactions } from "@/lib/placeholder";
import { ROUTES } from "@/lib/routes";
import { transactionColumns } from "./transaction-columns";

type PropertyPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ transactionPage?: string }>;
};

const pageSize = 2;

export default async function PropertyPage({
  params,
  searchParams,
}: PropertyPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const transactionPage = Number(query.transactionPage ?? "1");

  return (
    <main className="container mx-auto flex flex-col gap-4 px-5 py-6">
      <Button asChild className="self-start" variant="outline">
        <Link href={ROUTES.PROPERTIES}>Back to properties</Link>
      </Button>
      <Suspense fallback={<PropertySkeleton />}>
        <Property
          id={id}
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
}: {
  id: string;
  transactionPage: number;
}) {
  // this is a placeholder for fetching data from the database
  const data = {
    property: properties.find((property) => property.id === id),
    transactions: resaleTransactions.filter(
      (transaction) => transaction.propertyId === id,
    ),
  };

  if (!data || !data.property) {
    notFound();
  }

  const pageCount = Math.max(1, Math.ceil(data.transactions.length / pageSize));
  const currentPage = Math.min(transactionPage, pageCount);
  const transactions = data.transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Block {data.property.block}, {data.property.streetName}
          </CardTitle>
          <CardDescription>{data.property.town}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <PropertyField label="Flat Type" value={data.property.flatType} />
          <PropertyField label="Flat Model" value={data.property.flatModel} />
          <PropertyField
            label="Lease Commence Year"
            value={data.property.leaseCommenceYear}
          />
          <PropertyField
            label="Latest Resale Price"
            value={data.property.resalePrice.toLocaleString("en-SG", {
              currency: "SGD",
              style: "currency",
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {data.transactions.length} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaginatedDataTable
            columns={transactionColumns}
            currentPage={currentPage}
            data={transactions}
            emptyMessage="No transactions found."
            getPageHref={(page) =>
              `${ROUTES.PROPERTIES}/${id}?transactionPage=${page}`
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

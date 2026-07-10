import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { isSignedIn } from "@/lib/permissions";
import { getPropertyById } from "@/lib/tables/properties";
import { isPropertySaved } from "@/lib/tables/saved-properties";
import { listTransactions } from "@/lib/tables/transactions";
import { ROUTES } from "@/lib/routes";
import { PropertySummaryCard } from "@/components/properties/property-summary-card";
import { PropertyStatisticsCard } from "@/components/properties/property-statistics-card";
import { TransactionsTable } from "@/components/properties/transactions-table";
import { BookmarkButton } from "@/components/bookmarks/bookmark-button";

const PAGE_SIZE = 8;

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [property, { data: transactions, total }] = await Promise.all([
    getPropertyById(id),
    listTransactions({ property_id: id, page: 1, pageSize: PAGE_SIZE }),
  ]);
  if (!property) notFound();

  const session = await auth();
  const initialSaved =
    session && isSignedIn(session.user.role)
      ? await isPropertySaved({ userId: session.user.id, propertyId: id })
      : false;

  const flatTypes = [...new Set(transactions.map((t) => t.flat_type_name))];
  const flatModels = [...new Set(transactions.map((t) => t.flat_model_name))];

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href={ROUTES.PROPERTIES}>Back to properties</Link>
        </Button>
        <BookmarkButton
          propertyId={id}
          initialSaved={initialSaved}
          className="ml-auto"
        />
      </div>

      <PropertySummaryCard
        property={property}
        flatTypes={flatTypes}
        flatModels={flatModels}
      />

      <PropertyStatisticsCard />

      <TransactionsTable
        propertyId={id}
        initialData={transactions}
        initialTotal={total}
      />
    </main>
  );
}

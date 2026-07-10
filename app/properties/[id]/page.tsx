import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getPropertyById } from "@/lib/tables/properties";
import { listTransactions } from "@/lib/tables/transactions";
import { ROUTES } from "@/lib/routes";
import { TransactionsTable } from "@/components/properties/transactions-table";

const PAGE_SIZE = 20;

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const { data: transactions, total } = await listTransactions({
    property_id: id,
    page: 1,
    pageSize: PAGE_SIZE,
  });

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <Button asChild variant="outline" className="w-fit">
        <Link href={ROUTES.PROPERTIES}>Back to properties</Link>
      </Button>

      <TransactionsTable
        propertyId={id}
        initialData={transactions}
        initialTotal={total}
      />
    </main>
  );
}

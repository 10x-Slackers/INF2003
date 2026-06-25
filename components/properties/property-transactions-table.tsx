import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { transactions } from "@/lib/frontend/placeholders";

export function PropertyTransactionsTable({
  propertyId,
}: {
  propertyId: string;
}) {
  const recentTransactions = transactions.filter(
    (transaction) => transaction.propertyId === propertyId,
  );

  return (
    <DataTablePlaceholder
      columns={[
        { key: "month", header: "Month" },
        { key: "flatType", header: "Flat type" },
        { key: "flatModel", header: "Flat model" },
        { key: "storeyRange", header: "Storey" },
        { key: "floorAreaSqm", header: "Floor area sqm" },
        { key: "price", header: "Resale price" },
      ]}
      rows={recentTransactions}
    />
  );
}

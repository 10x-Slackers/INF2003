import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/lib/routes";
import type { TransactionListItem } from "@/lib/tables/transactions";

const COLUMN_COUNT = 9;
const LOCALE = "en-SG";
const pad = (value: number) => String(value).padStart(2, "0");
const formatNumber = (value: number) =>
  value.toLocaleString(LOCALE, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

type TransactionsTableProps = {
  transactions: TransactionListItem[];
  loading: boolean;
};

export function TransactionsTable({
  transactions,
  loading,
}: TransactionsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction Month</TableHead>
            <TableHead>Town</TableHead>
            <TableHead>Block / Street</TableHead>
            <TableHead>Flat Type</TableHead>
            <TableHead>Flat Model</TableHead>
            <TableHead>Storey Range</TableHead>
            <TableHead>Floor Area</TableHead>
            <TableHead>Resale Price</TableHead>
            <TableHead>$/sqm</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows />
          ) : transactions.length === 0 ? (
            <EmptyRow />
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {new Date(transaction.transaction_month).toLocaleDateString(
                    LOCALE,
                    { month: "short", year: "numeric" },
                  )}
                </TableCell>
                <TableCell>{transaction.town_name}</TableCell>
                <TableCell>
                  <Link
                    className="underline-offset-4 hover:underline"
                    href={`${ROUTES.PROPERTIES}/${transaction.property_id}`}
                  >
                    {transaction.block} {transaction.street_name}
                  </Link>
                </TableCell>
                <TableCell>{transaction.flat_type_name}</TableCell>
                <TableCell>{transaction.flat_model_name}</TableCell>
                <TableCell>
                  {pad(transaction.min_storey)} To {pad(transaction.max_storey)}
                </TableCell>
                <TableCell>
                  {formatNumber(transaction.floor_area_sqm)} sqm
                </TableCell>
                <TableCell>
                  S${formatNumber(transaction.resale_price)}
                </TableCell>
                <TableCell>
                  S${formatNumber(transaction.price_per_sqm)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: COLUMN_COUNT }).map((_, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function EmptyRow() {
  return (
    <TableRow>
      <TableCell
        colSpan={COLUMN_COUNT}
        className="py-8 text-center text-muted-foreground"
      >
        No transactions found.
      </TableCell>
    </TableRow>
  );
}

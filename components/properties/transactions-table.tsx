"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransactionListItem } from "@/lib/tables/transactions";
import { fetchTransactionsAction } from "@/app/properties/[id]/actions";

const PAGE_SIZE = 8;
const COLUMN_COUNT = 7;

export function TransactionsTable({
  propertyId,
  initialData,
  initialTotal,
}: {
  propertyId: string;
  initialData: TransactionListItem[];
  initialTotal: number;
}) {
  const [transactions, setTransactions] = useState(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function goToPage(p: number) {
    setLoading(true);
    try {
      const { data, total } = await fetchTransactionsAction({
        property_id: propertyId,
        page: p,
        pageSize: PAGE_SIZE,
      });
      if (!mounted.current) return;
      setTransactions(data);
      setTotal(total);
      setPage(p);
    } catch {
      if (!mounted.current) return;
      toast.error("Failed to load transactions");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction month</TableHead>
              <TableHead>Flat type</TableHead>
              <TableHead>Flat model</TableHead>
              <TableHead>Storey range</TableHead>
              <TableHead>Floor area (sqm)</TableHead>
              <TableHead>Resale price</TableHead>
              <TableHead>$/sqm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-8 text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.transaction_month).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </TableCell>
                  <TableCell>{transaction.flat_type_name}</TableCell>
                  <TableCell>{transaction.flat_model_name}</TableCell>
                  <TableCell>
                    {transaction.min_storey}-{transaction.max_storey}
                  </TableCell>
                  <TableCell>
                    {Math.round(transaction.floor_area_sqm)} sqm
                  </TableCell>
                  <TableCell>
                    S$
                    {Math.round(transaction.resale_price).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    S$
                    {Math.round(transaction.price_per_sqm).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalLabel={`${total} transactions total`}
        loading={loading}
        onPrev={() => goToPage(Math.max(1, page - 1))}
        onNext={() => goToPage(Math.min(totalPages, page + 1))}
      />
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

import Link from "next/link";
import { PaginatedDataTable } from "@/components/dashboard/PaginatedDataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FlatModel, FlatType, StoreyRange } from "@/lib/tables/lookups";
import type { TransactionListItem } from "@/lib/tables/transactions";
import { transactionColumns } from "./transaction-columns";

export type PropertyTransactionFilters = {
  flatTypeId: string;
  flatModelId: string;
  storeyRangeId: string;
  year: string;
};

type PropertyTransactionsTableProps = {
  propertyId: string;
  from?: "bookmarks";
  transactions: TransactionListItem[];
  total: number;
  flatTypes: readonly FlatType[];
  flatModels: readonly FlatModel[];
  storeyRanges: readonly StoreyRange[];
  filters: PropertyTransactionFilters;
  currentPage: number;
  pageCount: number;
};

export function PropertyTransactionsTable({
  propertyId,
  from,
  transactions,
  total,
  flatTypes,
  flatModels,
  storeyRanges,
  filters,
  currentPage,
  pageCount,
}: PropertyTransactionsTableProps) {
  const basePath = `/properties/${propertyId}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>{total} transactions found</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-4" action={basePath}>
          {from && <input type="hidden" name="from" value={from} />}

          <div className="flex min-w-32 flex-1 flex-col gap-2">
            <Label>Flat Type</Label>
            <Select defaultValue={filters.flatTypeId} name="flatTypeId">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All flat types</SelectItem>
                {flatTypes.map((flatType) => (
                  <SelectItem key={flatType.id} value={String(flatType.id)}>
                    {flatType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-32 flex-1 flex-col gap-2">
            <Label>Flat Model</Label>
            <Select defaultValue={filters.flatModelId} name="flatModelId">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All flat models</SelectItem>
                {flatModels.map((flatModel) => (
                  <SelectItem key={flatModel.id} value={String(flatModel.id)}>
                    {flatModel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-32 flex-1 flex-col gap-2">
            <Label>Storey Range</Label>
            <Select defaultValue={filters.storeyRangeId} name="storeyRangeId">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All storey ranges</SelectItem>
                {storeyRanges.map((storeyRange) => (
                  <SelectItem
                    key={storeyRange.id}
                    value={String(storeyRange.id)}
                  >
                    {storeyRange.min_storey} To {storeyRange.max_storey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-24 flex-1 flex-col gap-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              max="2100"
              min="1960"
              name="year"
              type="number"
              defaultValue={filters.year}
            />
          </div>

          <Button className="min-w-24 flex-1" type="submit">
            Apply
          </Button>
          <Button asChild className="min-w-24 flex-1" variant="outline">
            <Link href={from ? `${basePath}?from=${from}` : basePath}>
              Reset
            </Link>
          </Button>
        </form>

        <PaginatedDataTable
          columns={transactionColumns}
          currentPage={currentPage}
          data={transactions}
          emptyMessage="No transactions found."
          getPageHref={(page) => getPageHref(basePath, page, filters, from)}
          getRowKey={(transaction) => transaction.id}
          pageCount={pageCount}
        />
      </CardContent>
    </Card>
  );
}

function getPageHref(
  basePath: string,
  page: number,
  filters: PropertyTransactionFilters,
  from?: "bookmarks",
) {
  const params = new URLSearchParams();

  if (filters.flatTypeId !== "all")
    params.set("flatTypeId", filters.flatTypeId);
  if (filters.flatModelId !== "all")
    params.set("flatModelId", filters.flatModelId);
  if (filters.storeyRangeId !== "all")
    params.set("storeyRangeId", filters.storeyRangeId);
  if (filters.year !== "") params.set("year", filters.year);
  if (from) params.set("from", from);
  params.set("transactionPage", String(page));

  return `${basePath}?${params.toString()}`;
}

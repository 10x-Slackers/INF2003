"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import {
  fetchTransactionFilters,
  fetchTransactions,
} from "@/app/transactions/actions";
import type { FlatModel, FlatType } from "@/lib/tables/lookups";
import type { Town } from "@/lib/tables/towns";
import type { TransactionListItem } from "@/lib/tables/transactions";
import { TransactionsTable } from "@/components/transactions/table/transactions-table";

const PAGE_SIZE = 20;

type Filters = {
  townId: string;
  flatTypeId: string;
  flatModelId: string;
  minPrice: string;
  maxPrice: string;
};

const DEFAULT_FILTERS: Filters = {
  townId: "all",
  flatTypeId: "all",
  flatModelId: "all",
  minPrice: "",
  maxPrice: "",
};

export function TransactionsPanel() {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [towns, setTowns] = useState<Town[]>([]);
  const [flatTypes, setFlatTypes] = useState<FlatType[]>([]);
  const [flatModels, setFlatModels] = useState<FlatModel[]>([]);

  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    fetchTransactionFilters().then(({ towns, flatTypes, flatModels }) => {
      setTowns(towns);
      setFlatTypes(flatTypes);
      setFlatModels(flatModels);
    });
  }, []);

  async function load(
    currentPage: number,
    currentFilters: Filters,
    cancelled: { current: boolean } = { current: false },
  ) {
    try {
      const { data, total } = await fetchTransactions({
        page: currentPage,
        pageSize: PAGE_SIZE,
        town_id:
          currentFilters.townId !== "all" ? currentFilters.townId : undefined,
        flat_type_id:
          currentFilters.flatTypeId !== "all"
            ? Number(currentFilters.flatTypeId)
            : undefined,
        flat_model_id:
          currentFilters.flatModelId !== "all"
            ? Number(currentFilters.flatModelId)
            : undefined,
        price_min: currentFilters.minPrice
          ? Number(currentFilters.minPrice)
          : undefined,
        price_max: currentFilters.maxPrice
          ? Number(currentFilters.maxPrice)
          : undefined,
      });
      if (cancelled.current) return;
      setTransactions(data);
      setTotal(total);
    } catch {
      if (cancelled.current) return;
      setTransactions([]);
      setTotal(0);
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  }

  useEffect(() => {
    const cancelled = { current: false };
    (async () => {
      await load(page, applied, cancelled);
    })();
    return () => {
      cancelled.current = true;
    };
  }, [page, applied]);

  function applyFilters() {
    setLoading(true);
    setApplied(draft);
    setPage(1);
  }

  function resetFilters() {
    setLoading(true);
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setPage(1);
  }

  function goToPage(p: number) {
    setLoading(true);
    setPage(p);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label htmlFor="townId">Town</Label>
          <Select
            value={draft.townId}
            onValueChange={(value) =>
              setDraft((prev) => ({ ...prev, townId: value }))
            }
          >
            <SelectTrigger id="townId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All towns</SelectItem>
              {towns.map((town) => (
                <SelectItem key={town.id} value={town.id}>
                  {town.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label htmlFor="flatTypeId">Flat Type</Label>
          <Select
            value={draft.flatTypeId}
            onValueChange={(value) =>
              setDraft((prev) => ({ ...prev, flatTypeId: value }))
            }
          >
            <SelectTrigger id="flatTypeId" className="w-full">
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

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label htmlFor="flatModelId">Flat Model</Label>
          <Select
            value={draft.flatModelId}
            onValueChange={(value) =>
              setDraft((prev) => ({ ...prev, flatModelId: value }))
            }
          >
            <SelectTrigger id="flatModelId" className="w-full">
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

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label htmlFor="min-price">Min Price</Label>
          <Input
            id="min-price"
            min="0"
            type="number"
            value={draft.minPrice}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, minPrice: e.target.value }))
            }
          />
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label htmlFor="max-price">Max Price</Label>
          <Input
            id="max-price"
            min="0"
            type="number"
            value={draft.maxPrice}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, maxPrice: e.target.value }))
            }
          />
        </div>

        <Button className="min-w-24 flex-1" onClick={applyFilters}>
          Search
        </Button>
        <Button
          variant="outline"
          className="min-w-24 flex-1"
          onClick={resetFilters}
        >
          Reset
        </Button>
      </div>

      <TransactionsTable transactions={transactions} loading={loading} />

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

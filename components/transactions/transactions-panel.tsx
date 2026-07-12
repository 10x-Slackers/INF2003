"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/pagination-controls";
import { FilterSelect } from "@/components/filter-select";
import { fetchTransactions } from "@/app/transactions/actions";
import { fetchPropertyFilters } from "@/app/properties/actions";
import type { FlatModel, FlatType } from "@/lib/tables/lookups";
import type { Town } from "@/lib/tables/towns";
import type { TransactionListItem } from "@/lib/tables/transactions";
import { TransactionsTable } from "./transactions-table";

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
    const cancelled = { current: false };
    fetchPropertyFilters()
      .then(({ towns, flatTypes, flatModels }) => {
        if (cancelled.current) return;
        setTowns(towns);
        setFlatTypes(flatTypes);
        setFlatModels(flatModels);
      })
      .catch(() => {
        if (cancelled.current) return;
        toast.error("Failed to load filter options");
      });
    return () => {
      cancelled.current = true;
    };
  }, []);

  const load = useCallback(
    async (
      currentPage: number,
      currentFilters: Filters,
      cancelled: { current: boolean } = { current: false },
    ) => {
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
        toast.error("Failed to load transactions");
        setTransactions([]);
        setTotal(0);
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const cancelled = { current: false };
    (async () => {
      await load(page, applied, cancelled);
    })();
    return () => {
      cancelled.current = true;
    };
  }, [page, applied, load]);

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
        <FilterSelect
          label="Town"
          allLabel="All towns"
          value={draft.townId}
          onValueChange={(value) =>
            setDraft((prev) => ({ ...prev, townId: value }))
          }
          options={towns}
        />
        <FilterSelect
          label="Flat Type"
          allLabel="All flat types"
          value={draft.flatTypeId}
          onValueChange={(value) =>
            setDraft((prev) => ({ ...prev, flatTypeId: value }))
          }
          options={flatTypes}
        />
        <FilterSelect
          label="Flat Model"
          allLabel="All flat models"
          value={draft.flatModelId}
          onValueChange={(value) =>
            setDraft((prev) => ({ ...prev, flatModelId: value }))
          }
          options={flatModels}
        />

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label>Min Price</Label>
          <Input
            min="0"
            type="number"
            value={draft.minPrice}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, minPrice: e.target.value }))
            }
          />
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label>Max Price</Label>
          <Input
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

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalLabel={`${total} transactions total`}
        loading={loading}
        onPrev={() => goToPage(Math.max(1, page - 1))}
        onNext={() => goToPage(Math.min(totalPages, page + 1))}
        onGoToPage={goToPage}
      />
    </div>
  );
}

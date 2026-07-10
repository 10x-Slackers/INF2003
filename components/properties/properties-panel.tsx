"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Pagination } from "@/components/ui/pagination";
import {
  fetchPropertyFilters,
  fetchProperties,
} from "@/app/properties/actions";
import type { FlatModel, FlatType } from "@/lib/tables/lookups";
import type { Town } from "@/lib/tables/towns";
import type { PropertyWithLatestTransaction } from "@/lib/tables/properties";
import { PropertiesTable } from "./properties-table";

const PAGE_SIZE = 20;

type Filters = {
  townIds: string[];
  flatTypeIds: string[];
  flatModelIds: string[];
  streetName: string;
  block: string;
  leaseCommenceYear: string;
};

const DEFAULT_FILTERS: Filters = {
  townIds: [],
  flatTypeIds: [],
  flatModelIds: [],
  streetName: "",
  block: "",
  leaseCommenceYear: "",
};

export function PropertiesPanel() {
  const [properties, setProperties] = useState<PropertyWithLatestTransaction[]>(
    [],
  );
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
    fetchPropertyFilters().then(({ towns, flatTypes, flatModels }) => {
      if (cancelled.current) return;
      setTowns(towns);
      setFlatTypes(flatTypes);
      setFlatModels(flatModels);
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
        const { data, total } = await fetchProperties({
          page: currentPage,
          pageSize: PAGE_SIZE,
          town_ids: currentFilters.townIds.length
            ? currentFilters.townIds
            : undefined,
          flat_type_ids: currentFilters.flatTypeIds.length
            ? currentFilters.flatTypeIds.map(Number)
            : undefined,
          flat_model_ids: currentFilters.flatModelIds.length
            ? currentFilters.flatModelIds.map(Number)
            : undefined,
          street_name: currentFilters.streetName || undefined,
          block: currentFilters.block || undefined,
          lease_commence_year: currentFilters.leaseCommenceYear
            ? Number(currentFilters.leaseCommenceYear)
            : undefined,
        });
        if (cancelled.current) return;
        setProperties(data);
        setTotal(total);
      } catch {
        if (cancelled.current) return;
        toast.error("Failed to load properties");
        setProperties([]);
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
        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label>Town</Label>
          <MultiSelect
            options={towns.map((town) => ({
              value: town.id,
              label: town.name,
              group: town.region,
            }))}
            value={draft.townIds}
            onChange={(townIds) => setDraft((prev) => ({ ...prev, townIds }))}
            placeholder="All towns"
          />
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label>Flat Type</Label>
          <MultiSelect
            options={flatTypes.map((flatType) => ({
              value: String(flatType.id),
              label: flatType.name,
            }))}
            value={draft.flatTypeIds}
            onChange={(flatTypeIds) =>
              setDraft((prev) => ({ ...prev, flatTypeIds }))
            }
            placeholder="All flat types"
          />
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label>Flat Model</Label>
          <MultiSelect
            options={flatModels.map((flatModel) => ({
              value: String(flatModel.id),
              label: flatModel.name,
            }))}
            value={draft.flatModelIds}
            onChange={(flatModelIds) =>
              setDraft((prev) => ({ ...prev, flatModelIds }))
            }
            placeholder="All flat models"
          />
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label htmlFor="street-name">Street Name</Label>
          <Input
            id="street-name"
            value={draft.streetName}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, streetName: e.target.value }))
            }
          />
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label htmlFor="block">Block</Label>
          <Input
            id="block"
            value={draft.block}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, block: e.target.value }))
            }
          />
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <Label htmlFor="lease-year">Lease Commence Year</Label>
          <Input
            id="lease-year"
            type="number"
            min={1960}
            max={2100}
            value={draft.leaseCommenceYear}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                leaseCommenceYear: e.target.value,
              }))
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

      <PropertiesTable properties={properties} loading={loading} />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalLabel={`${total} properties total`}
        loading={loading}
        onPrev={() => goToPage(Math.max(1, page - 1))}
        onNext={() => goToPage(Math.min(totalPages, page + 1))}
      />
    </div>
  );
}

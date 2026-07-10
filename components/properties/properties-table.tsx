"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
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
import type { PropertyWithLatestTransaction } from "@/lib/tables/properties";
import type { Town } from "@/lib/tables/towns";
import type { FlatModel, FlatType } from "@/lib/tables/lookups";
import { ROUTES } from "@/lib/routes";
import { fetchPropertiesAction } from "@/app/properties/actions";

const PAGE_SIZE = 20;
const COLUMN_COUNT = 5;

type Filters = {
  townIds: string[];
  streetName: string;
  leaseCommenceYear: string;
  flatTypeIds: string[];
  flatModelIds: string[];
};

const EMPTY_FILTERS: Filters = {
  townIds: [],
  streetName: "",
  leaseCommenceYear: "",
  flatTypeIds: [],
  flatModelIds: [],
};

export function PropertiesTable({
  initialData,
  initialTotal,
  towns,
  flatTypes,
  flatModels,
}: {
  initialData: PropertyWithLatestTransaction[];
  initialTotal: number;
  towns: Town[];
  flatTypes: FlatType[];
  flatModels: FlatModel[];
}) {
  const [properties, setProperties] = useState(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function load(p: number, applied: Filters) {
    setLoading(true);
    try {
      const { data, total } = await fetchPropertiesAction({
        page: p,
        pageSize: PAGE_SIZE,
        town_ids: applied.townIds.length ? applied.townIds : undefined,
        street_name: applied.streetName || undefined,
        lease_commence_year: applied.leaseCommenceYear
          ? Number(applied.leaseCommenceYear)
          : undefined,
        flat_type_ids: applied.flatTypeIds.length
          ? applied.flatTypeIds.map(Number)
          : undefined,
        flat_model_ids: applied.flatModelIds.length
          ? applied.flatModelIds.map(Number)
          : undefined,
      });
      setProperties(data);
      setTotal(total);
      setPage(p);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    setAppliedFilters(filters);
    load(1, filters);
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    load(1, EMPTY_FILTERS);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid w-48 gap-2">
          <Label>Town</Label>
          <MultiSelect
            options={towns.map((town) => ({
              value: town.id,
              label: town.name,
              group: town.region,
            }))}
            value={filters.townIds}
            onChange={(townIds) => setFilters({ ...filters, townIds })}
            placeholder="All towns"
          />
        </div>
        <div className="grid gap-2">
          <Label>Street Name</Label>
          <Input
            value={filters.streetName}
            onChange={(e) =>
              setFilters({ ...filters, streetName: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>Lease Commence Year</Label>
          <Input
            type="number"
            min={1960}
            max={2100}
            value={filters.leaseCommenceYear}
            onChange={(e) =>
              setFilters({ ...filters, leaseCommenceYear: e.target.value })
            }
          />
        </div>
        <div className="grid w-48 gap-2">
          <Label>Flat Type</Label>
          <MultiSelect
            options={flatTypes.map((flatType) => ({
              value: String(flatType.id),
              label: flatType.name,
            }))}
            value={filters.flatTypeIds}
            onChange={(flatTypeIds) => setFilters({ ...filters, flatTypeIds })}
            placeholder="All flat types"
          />
        </div>
        <div className="grid w-48 gap-2">
          <Label>Flat Model</Label>
          <MultiSelect
            options={flatModels.map((flatModel) => ({
              value: String(flatModel.id),
              label: flatModel.name,
            }))}
            value={filters.flatModelIds}
            onChange={(flatModelIds) =>
              setFilters({ ...filters, flatModelIds })
            }
            placeholder="All flat models"
          />
        </div>
        <Button onClick={handleApply} disabled={loading}>
          Apply
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          Reset
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Town</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Street name</TableHead>
              <TableHead>Lease commence year</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : properties.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-8 text-center text-muted-foreground"
                >
                  No properties found.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>{property.town_name}</TableCell>
                  <TableCell className="font-medium">
                    {property.block}
                  </TableCell>
                  <TableCell>{property.street_name}</TableCell>
                  <TableCell>{property.lease_commence_year}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={ROUTES.PROPERTY_DETAIL(property.id)}>
                        View
                      </Link>
                    </Button>
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
        totalLabel={`${total} properties total`}
        loading={loading}
        onPrev={() => load(Math.max(1, page - 1), appliedFilters)}
        onNext={() => load(Math.min(totalPages, page + 1), appliedFilters)}
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

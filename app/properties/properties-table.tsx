"use client";

import { useMemo, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/dashboard/DataTable";
import { PaginationWrapper } from "@/components/dashboard/PaginationWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { propertyType } from "../../lib/placeholder";

const pageSize = 2;

type PropertyFilters = {
  flatTypeId: string;
  flatModelId: string;
  minPrice: string;
  maxPrice: string;
};

type PropertiesTableProps = {
  properties: propertyType[];
  flatTypes: readonly { id: string; name: string }[];
  flatModels: readonly { id: string; name: string }[];
};

const initialFilters = {
  flatTypeId: "all",
  flatModelId: "all",
  minPrice: "",
  maxPrice: "",
};

const propertyColumns = [
  { key: "town", header: "Town", cell: (row) => row.town },
  { key: "flatType", header: "Flat Type", cell: (row) => row.flatType },
  { key: "flatModel", header: "Flat Model", cell: (row) => row.flatModel },
  { key: "block", header: "Block", cell: (row) => row.block },
  { key: "streetName", header: "Street Name", cell: (row) => row.streetName },
  {
    key: "leaseCommenceYear",
    header: "Lease Commence Year",
    cell: (row) => row.leaseCommenceYear,
  },
  {
    key: "resalePrice",
    header: "Resale Price",
    cell: (row) =>
      row.resalePrice.toLocaleString("en-SG", {
        currency: "SGD",
        style: "currency",
      }),
  },
] satisfies DataTableColumn<propertyType>[];

function filterProperties(
  properties: propertyType[],
  filters: PropertyFilters,
  page: number,
) {
  const filteredProperties = properties.filter(
    (property) =>
      (filters.flatTypeId === "all" ||
        property.flatTypeId === filters.flatTypeId) &&
      (filters.flatModelId === "all" ||
        property.flatModelId === filters.flatModelId) &&
      (filters.minPrice === "" ||
        property.resalePrice >= Number(filters.minPrice)) &&
      (filters.maxPrice === "" ||
        property.resalePrice <= Number(filters.maxPrice)),
  );

  return {
    properties: filteredProperties.slice(
      (page - 1) * pageSize,
      page * pageSize,
    ),
    total: filteredProperties.length,
  };
}

export function PropertiesTable({
  properties,
  flatTypes,
  flatModels,
}: PropertiesTableProps) {
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const results = useMemo(
    () => filterProperties(properties, appliedFilters, page),
    [appliedFilters, page, properties],
  );
  const pageCount = Math.max(1, Math.ceil(results.total / pageSize));
  const currentPage = Math.min(page, pageCount);

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setPage(1);
  }

  function clearFilters() {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  }

  function updatePage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label>Flat Type</Label>
            <Select
              value={draftFilters.flatTypeId}
              onValueChange={(value) => {
                setDraftFilters((filters) => ({
                  ...filters,
                  flatTypeId: value,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All flat types</SelectItem>
                {flatTypes.map((flatType) => (
                  <SelectItem key={flatType.id} value={flatType.id}>
                    {flatType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label>Flat Model</Label>
            <Select
              value={draftFilters.flatModelId}
              onValueChange={(value) => {
                setDraftFilters((filters) => ({
                  ...filters,
                  flatModelId: value,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All flat models</SelectItem>
                {flatModels.map((flatModel) => (
                  <SelectItem key={flatModel.id} value={flatModel.id}>
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
              value={draftFilters.minPrice}
              onChange={(event) => {
                setDraftFilters((filters) => ({
                  ...filters,
                  minPrice: event.target.value,
                }));
              }}
            />
          </div>

          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label htmlFor="max-price">Max Price</Label>
            <Input
              id="max-price"
              min="0"
              type="number"
              value={draftFilters.maxPrice}
              onChange={(event) => {
                setDraftFilters((filters) => ({
                  ...filters,
                  maxPrice: event.target.value,
                }));
              }}
            />
          </div>

          <Button className="min-w-24 flex-1" type="submit">
            Apply
          </Button>
          <Button
            className="min-w-24 flex-1"
            type="button"
            variant="outline"
            onClick={clearFilters}
          >
            Reset
          </Button>
        </form>

        <DataTable
          columns={propertyColumns}
          data={results.properties}
          emptyMessage="No properties found."
          getRowKey={(property) => property.id}
        />

        <PaginationWrapper
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={updatePage}
        />
      </CardContent>
    </Card>
  );
}

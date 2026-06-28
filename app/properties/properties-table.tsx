import Link from "next/link";
import { PaginatedDataTable } from "@/components/dashboard/PaginatedDataTable";
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
import { propertyColumns } from "./property-columns";

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
  filters: PropertyFilters;
  currentPage: number;
  pageCount: number;
};

export function PropertiesTable({
  properties,
  flatTypes,
  flatModels,
  filters,
  currentPage,
  pageCount,
}: PropertiesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-4" action="/properties">
          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label>Flat Type</Label>
            <Select defaultValue={filters.flatTypeId} name="flatTypeId">
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
            <Select defaultValue={filters.flatModelId} name="flatModelId">
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
              name="minPrice"
              type="number"
              defaultValue={filters.minPrice}
            />
          </div>

          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label htmlFor="max-price">Max Price</Label>
            <Input
              id="max-price"
              min="0"
              name="maxPrice"
              type="number"
              defaultValue={filters.maxPrice}
            />
          </div>

          <Button className="min-w-24 flex-1" type="submit">
            Apply
          </Button>
          <Button asChild className="min-w-24 flex-1" variant="outline">
            <Link href="/properties">Reset</Link>
          </Button>
        </form>

        <PaginatedDataTable
          columns={propertyColumns}
          currentPage={currentPage}
          data={properties}
          emptyMessage="No properties found."
          getPageHref={(page) => getPageHref(page, filters)}
          getRowKey={(property) => property.id}
          pageCount={pageCount}
        />
      </CardContent>
    </Card>
  );
}

function getPageHref(page: number, filters: PropertyFilters) {
  const params = new URLSearchParams();

  if (filters.flatTypeId !== "all") {
    params.set("flatTypeId", filters.flatTypeId);
  }
  if (filters.flatModelId !== "all") {
    params.set("flatModelId", filters.flatModelId);
  }
  if (filters.minPrice !== "") {
    params.set("minPrice", filters.minPrice);
  }
  if (filters.maxPrice !== "") {
    params.set("maxPrice", filters.maxPrice);
  }
  params.set("page", String(page));

  return `/properties?${params.toString()}`;
}

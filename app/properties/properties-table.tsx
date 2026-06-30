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
import { propertyColumns } from "./property-columns";
import type { PropertyListItem } from "@/lib/tables/properties";
import type { FlatModel, FlatType } from "@/lib/tables/lookups";
import type { Town } from "@/lib/tables/towns";

type PropertiesTableProps = {
  currentPage: number;
  flatTypes: readonly FlatType[];
  flatModels: readonly FlatModel[];
  filters: URLSearchParams;
  pageCount: number;
  properties: PropertyListItem[];
  towns: Town[];
};

export function PropertiesTable({
  currentPage,
  properties,
  flatTypes,
  flatModels,
  filters,
  pageCount,
  towns,
}: PropertiesTableProps) {
  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-4" action="/properties">
          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label>Town</Label>
            <Select
              defaultValue={getSelectFilter(filters, "townId")}
              name="townId"
            >
              <SelectTrigger className="w-full">
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
            <Label>Flat Type</Label>
            <Select
              defaultValue={getSelectFilter(filters, "flatTypeId")}
              name="flatTypeId"
            >
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

          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label>Flat Model</Label>
            <Select
              defaultValue={getSelectFilter(filters, "flatModelId")}
              name="flatModelId"
            >
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

          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label htmlFor="min-price">Min Price</Label>
            <Input
              id="min-price"
              min="0"
              name="minPrice"
              type="number"
              defaultValue={filters.get("minPrice") ?? ""}
            />
          </div>

          <div className="flex min-w-40 flex-1 flex-col gap-2">
            <Label htmlFor="max-price">Max Price</Label>
            <Input
              id="max-price"
              min="0"
              name="maxPrice"
              type="number"
              defaultValue={filters.get("maxPrice") ?? ""}
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
          data={properties.sort((a, b) =>
            a.town_name.localeCompare(b.town_name),
          )}
          emptyMessage="No properties found."
          getPageHref={(page) => getPageHref(page, filters)}
          getRowKey={(property) => property.id}
          pageCount={pageCount}
        />
      </CardContent>
    </Card>
  );
}

function getPageHref(page: number, filters: URLSearchParams) {
  const params = new URLSearchParams(filters);
  params.set("page", String(page));

  return `/properties?${params.toString()}`;
}

function getSelectFilter(filters: URLSearchParams, name: string) {
  return filters.get(name) ?? "all";
}

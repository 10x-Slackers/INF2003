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
import { propertyColumns, type PropertyRow } from "./property-columns";

type PropertyFilters = {
  townId: string;
  leaseCommenceYear: string;
  minPrice: string;
  maxPrice: string;
};

type PropertiesTableProps = {
  properties: PropertyRow[];
  towns: readonly { id: string; name: string }[];
  filters: PropertyFilters;
  currentPage: number;
  pageCount: number;
};

export function PropertiesTable({
  properties,
  towns,
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
            <Label>Town</Label>
            <Select defaultValue={filters.townId} name="townId">
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
            <Label htmlFor="lease-commence-year">Lease Commence Year</Label>
            <Input
              id="lease-commence-year"
              max="2100"
              min="1960"
              name="leaseCommenceYear"
              type="number"
              defaultValue={filters.leaseCommenceYear}
            />
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

  if (filters.townId !== "all") {
    params.set("townId", filters.townId);
  }
  if (filters.leaseCommenceYear !== "") {
    params.set("leaseCommenceYear", filters.leaseCommenceYear);
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

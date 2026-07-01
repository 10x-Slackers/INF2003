import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listFlatModels, listFlatTypes } from "@/lib/tables/lookups/functions";
import { listProperties } from "@/lib/tables/properties/functions";
import { listTowns } from "@/lib/tables/towns/functions";

type SearchValue = string | string[] | undefined;

type SearchParams = {
  town_id?: SearchValue;
  flat_type_id?: SearchValue;
  flat_model_id?: SearchValue;
  price_min?: SearchValue;
  price_max?: SearchValue;
  page?: SearchValue;
  pageSize?: SearchValue;
};

type PropertyFilters = {
  town_id?: string;
  flat_type_id?: number;
  flat_model_id?: number;
  price_min?: number;
  price_max?: number;
  page: number;
  pageSize: number;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function first(value: SearchValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toOptionalPositiveInt(value: SearchValue): number | undefined {
  const raw = first(value);
  if (!raw) return undefined;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function toOptionalNonNegativeNumber(value: SearchValue): number | undefined {
  const raw = first(value);
  if (!raw) return undefined;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function toOptionalUuid(value: SearchValue): string | undefined {
  const raw = first(value);
  if (!raw || !uuidRegex.test(raw)) return undefined;
  return raw;
}

function parseFilters(searchParams: SearchParams): PropertyFilters {
  const page = toOptionalPositiveInt(searchParams.page) ?? 1;
  const pageSize = toOptionalPositiveInt(searchParams.pageSize) ?? 20;

  return {
    town_id: toOptionalUuid(searchParams.town_id),
    flat_type_id: toOptionalPositiveInt(searchParams.flat_type_id),
    flat_model_id: toOptionalPositiveInt(searchParams.flat_model_id),
    price_min: toOptionalNonNegativeNumber(searchParams.price_min),
    price_max: toOptionalNonNegativeNumber(searchParams.price_max),
    page,
    pageSize,
  };
}

function formatMonth(month: string | null): string {
  if (!month) return "N/A";
  const date = new Date(month);
  if (Number.isNaN(date.getTime())) return month;

  return new Intl.DateTimeFormat("en-SG", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(value: number | string | null): string {
  if (value === null) return "N/A";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return "N/A";

  return amount.toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildQuery(
  filters: PropertyFilters,
  overrides: Partial<PropertyFilters>,
) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.town_id) params.set("town_id", next.town_id);
  if (next.flat_type_id) params.set("flat_type_id", String(next.flat_type_id));
  if (next.flat_model_id)
    params.set("flat_model_id", String(next.flat_model_id));
  if (next.price_min !== undefined)
    params.set("price_min", String(next.price_min));
  if (next.price_max !== undefined)
    params.set("price_max", String(next.price_max));
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 20) params.set("pageSize", String(next.pageSize));

  const query = params.toString();
  return query ? `/properties?${query}` : "/properties";
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const parsedSearchParams = await searchParams;
  const filters = parseFilters(parsedSearchParams);

  const [townsResult, flatTypes, flatModels, propertiesResult] =
    await Promise.all([
      listTowns({ page: 1, pageSize: 100 }),
      listFlatTypes(),
      listFlatModels(),
      listProperties(filters),
    ]);

  const towns = townsResult.data;
  const townNameById = new Map(towns.map((town) => [town.id, town.name]));
  const totalPages = Math.max(
    1,
    Math.ceil(propertiesResult.total / filters.pageSize),
  );
  const hasPrev = filters.page > 1;
  const hasNext = filters.page < totalPages;

  return (
    <main className="container mx-auto px-5 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action="/properties" className="grid gap-4 lg:grid-cols-6">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="town_id">Town</Label>
              <select
                id="town_id"
                name="town_id"
                defaultValue={filters.town_id ?? ""}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All towns</option>
                {towns.map((town) => (
                  <option key={town.id} value={town.id}>
                    {town.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="flat_type_id">Flat Type</Label>
              <select
                id="flat_type_id"
                name="flat_type_id"
                defaultValue={filters.flat_type_id?.toString() ?? ""}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All flat types</option>
                {flatTypes.map((flatType) => (
                  <option key={flatType.id} value={flatType.id}>
                    {flatType.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="flat_model_id">Flat Model</Label>
              <select
                id="flat_model_id"
                name="flat_model_id"
                defaultValue={filters.flat_model_id?.toString() ?? ""}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All flat models</option>
                {flatModels.map((flatModel) => (
                  <option key={flatModel.id} value={flatModel.id}>
                    {flatModel.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="price_min">Min Price</Label>
              <Input
                id="price_min"
                name="price_min"
                type="number"
                min={0}
                step="0.01"
                className="w-full"
                defaultValue={filters.price_min?.toString() ?? ""}
              />
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="price_max">Max Price</Label>
              <Input
                id="price_max"
                name="price_max"
                type="number"
                min={0}
                step="0.01"
                className="w-full"
                defaultValue={filters.price_max?.toString() ?? ""}
              />
            </div>

            <div className="flex min-w-0 items-end gap-2">
              <Button type="submit" className="flex-1">
                Apply
              </Button>
              <Button
                asChild
                type="button"
                variant="outline"
                className="flex-1"
              >
                <Link href="/properties">Reset</Link>
              </Button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-2 py-2 font-medium">Town</th>
                  <th className="px-2 py-2 font-medium">Flat Type</th>
                  <th className="px-2 py-2 font-medium">Flat Model</th>
                  <th className="px-2 py-2 font-medium">Street Name</th>
                  <th className="px-2 py-2 font-medium">Last Transaction</th>
                  <th className="px-2 py-2 font-medium">Resale Price</th>
                  <th className="px-2 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {propertiesResult.data.length === 0 ? (
                  <tr>
                    <td className="px-2 py-6 text-muted-foreground" colSpan={7}>
                      No properties found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  propertiesResult.data.map((property) => (
                    <tr key={property.id} className="border-b">
                      <td className="px-2 py-2">
                        {townNameById.get(property.town_id) ?? "N/A"}
                      </td>
                      <td className="px-2 py-2">
                        {property.latest_transaction?.flat_type ?? "N/A"}
                      </td>
                      <td className="px-2 py-2">
                        {property.latest_transaction?.flat_model ?? "N/A"}
                      </td>
                      <td className="px-2 py-2">{`${property.block} ${property.street_name}`}</td>
                      <td className="px-2 py-2">
                        {formatMonth(
                          property.latest_transaction?.transaction_month ??
                            null,
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {formatPrice(
                          property.latest_transaction?.resale_price ?? null,
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <Button size="sm" variant="outline" disabled>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {(filters.page - 1) * filters.pageSize + 1}-
              {Math.min(
                filters.page * filters.pageSize,
                propertiesResult.total,
              )}{" "}
              of {propertiesResult.total}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" disabled={!hasPrev}>
                <Link
                  aria-disabled={!hasPrev}
                  href={buildQuery(filters, {
                    page: Math.max(1, filters.page - 1),
                  })}
                >
                  Previous
                </Link>
              </Button>
              <Button asChild variant="outline" disabled={!hasNext}>
                <Link
                  aria-disabled={!hasNext}
                  href={buildQuery(filters, {
                    page: Math.min(totalPages, filters.page + 1),
                  })}
                >
                  Next
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

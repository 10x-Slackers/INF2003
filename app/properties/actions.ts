"use server";

import { assertAgent, auth } from "@/lib/auth";
import {
  createProperty,
  listProperties,
  type CreateProperty,
  type PropertyListQuery,
  type PropertyWithLatestTransaction,
} from "@/lib/tables/properties";
import { fetchPropertyFilters } from "@/app/filters";
import { createSearchLog } from "@/lib/collections/search-logs";

export async function createPropertyAction(input: CreateProperty) {
  await assertAgent();
  const id = await createProperty(input);
  return id;
}

export async function fetchProperties(
  input: PropertyListQuery,
): Promise<{ data: PropertyWithLatestTransaction[]; total: number }> {
  void logPropertySearch(input);
  return listProperties(input);
}

async function logPropertySearch(input: PropertyListQuery) {
  if ((input.page ?? 1) !== 1) return;

  const query: Record<string, unknown> = {};
  if (input.town_ids?.length) query.townId = input.town_ids;
  if (input.flat_type_ids?.length)
    query.flatTypeId = input.flat_type_ids.map(String);
  if (input.flat_model_ids?.length)
    query.flatModelId = input.flat_model_ids.map(String);
  if (input.price_min != null || input.price_max != null) {
    query.price = { min: input.price_min, max: input.price_max };
  }
  if (input.lease_commence_year != null) {
    query.leaseCommenceYear = input.lease_commence_year;
  }
  if (Object.keys(query).length === 0) return;

  const session = await auth();
  await createSearchLog({
    userId: session?.user?.id ?? undefined,
    query,
  }).catch(() => {});
}

export { fetchPropertyFilters };

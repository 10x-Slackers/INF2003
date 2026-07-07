"use server";

import { assertAgent } from "@/lib/auth";
import { createProperty, type CreateProperty } from "@/lib/tables/properties";
import { listTowns, type Town } from "@/lib/tables/towns";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export async function createPropertyAction(input: CreateProperty) {
  await assertAgent();
  const id = await createProperty(input);
  revalidatePath(ROUTES.PROPERTIES);
  return id;
}

export async function fetchTownsAction(): Promise<Town[]> {
  await assertAgent();
  return listTowns();
}

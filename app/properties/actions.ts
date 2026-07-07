"use server";

import { assertAgent } from "@/lib/auth";
import { createProperty } from "@/lib/tables/properties/functions";
import { listTowns } from "@/lib/tables/towns/functions";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import type { CreateProperty } from "@/lib/tables/properties/types";
import type { Town } from "@/lib/tables/towns/types";

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

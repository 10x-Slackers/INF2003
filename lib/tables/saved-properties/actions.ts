"use server";

import { auth } from "@/lib/auth";
import { execute } from "@/lib/db";
import { handleDbError } from "@/lib/db-errors";
import { executeReturning } from "@/lib/db/mariadb";
import { createSavedPropertySchema } from "./types";

export async function createSavedProperty(propertyId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = createSavedPropertySchema.parse({
    userId: session.user.id,
    propertyId,
  });

  try {
    await executeReturning(
      "INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?)",
      [data.userId, data.propertyId],
    );
  } catch (error) {
    if ((error as { code?: string }).code !== "ER_DUP_ENTRY") {
      handleDbError(error);
    }
  }
}

export async function deleteSavedProperty(propertyId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await execute(
    "DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?",
    [session.user.id, propertyId],
  );
}

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { handleDbError, type DbResult } from "@/lib/utils";
import {
  createSavedAlertSchema,
  idSchema,
  type SavedAlert,
  type SavedAlertCreate,
  type SavedAlertUpdate,
  updateSavedAlertSchema,
} from "./types";

const alerts = db.collection<SavedAlert>("alerts");
const now = () => Math.floor(Date.now() / 1000);

export async function listSavedAlerts(
  userId?: string,
): Promise<DbResult<SavedAlert[]>> {
  try {
    return await alerts
      .find(userId ? { user_id: idSchema.parse(userId) } : {})
      .sort({ created_at: -1 })
      .toArray();
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getSavedAlertById(
  id: string,
): Promise<DbResult<SavedAlert | null>> {
  try {
    return await alerts.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function createSavedAlert(
  input: SavedAlertCreate,
): Promise<DbResult<SavedAlert>> {
  try {
    const data = createSavedAlertSchema.parse(input);
    const timestamp = now();
    const alert: SavedAlert = {
      _id: randomUUID(),
      user_id: data.user_id,
      filters: data.filters,
      is_active: data.is_active ?? true,
      created_at: timestamp,
      updated_at: timestamp,
    };

    await alerts.insertOne(alert);
    return alert;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateSavedAlert(
  id: string,
  input: SavedAlertUpdate,
): Promise<DbResult<SavedAlert | null>> {
  try {
    const data = updateSavedAlertSchema.parse(input);
    const parsedId = idSchema.parse(id);
    const result = await alerts.findOneAndUpdate(
      { _id: parsedId },
      {
        $set: {
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined),
          ),
          updated_at: now(),
        },
      },
      { returnDocument: "after" },
    );

    return result;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteSavedAlert(id: string): Promise<DbResult<boolean>> {
  try {
    const result = await alerts.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleDbError(error);
  }
}

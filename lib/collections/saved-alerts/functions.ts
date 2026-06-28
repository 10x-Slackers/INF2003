import { randomUUID } from "node:crypto";
import { MongoError } from "mongodb";
import { db } from "@/lib/db";
import {
  createSavedAlertSchema,
  idSchema,
  type SavedAlert,
  type SavedAlertCreate,
  type SavedAlertUpdate,
  updateSavedAlertSchema,
} from "./type";

const alerts = db.collection<SavedAlert>("alerts");
const now = () => Math.floor(Date.now() / 1000);
type CollectionResult<T> = T | Error;
const handleError = (error: unknown) => {
  if (error instanceof MongoError) {
    throw error;
  }
  return error instanceof Error ? error : new Error(String(error));
};

export async function listSavedAlerts(
  userId?: string,
): Promise<CollectionResult<SavedAlert[]>> {
  try {
    return await alerts
      .find(userId ? { user_id: idSchema.parse(userId) } : {})
      .sort({ created_at: -1 })
      .toArray();
  } catch (error) {
    return handleError(error);
  }
}

export async function getSavedAlertById(
  id: string,
): Promise<CollectionResult<SavedAlert | null>> {
  try {
    return await alerts.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSavedAlert(
  input: SavedAlertCreate,
): Promise<CollectionResult<SavedAlert>> {
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
    return handleError(error);
  }
}

export async function updateSavedAlert(
  id: string,
  input: SavedAlertUpdate,
): Promise<CollectionResult<SavedAlert | null>> {
  try {
    const data = updateSavedAlertSchema.parse(input);
    const parsedId = idSchema.parse(id);
    const result = await alerts.updateOne(
      { _id: parsedId },
      {
        $set: {
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined),
          ),
          updated_at: now(),
        },
      },
    );

    return result.matchedCount ? alerts.findOne({ _id: parsedId }) : null;
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSavedAlert(
  id: string,
): Promise<CollectionResult<boolean>> {
  try {
    const result = await alerts.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleError(error);
  }
}

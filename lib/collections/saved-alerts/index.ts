import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/mongodb";
import type {
  SavedAlert,
  SavedAlertCreate,
  SavedAlertUpdate,
} from "@/lib/schema/saved-alert";
import { idSchema, now } from "@/lib/schema/mongodb-common";
import {
  createSavedAlertSchema,
  updateSavedAlertSchema,
} from "@/lib/schema/saved-alert";

const alerts = db.collection<SavedAlert>("alerts");

export async function listSavedAlerts(
  userId?: string,
): Promise<SavedAlert[] | null> {
  try {
    return await alerts
      .find(userId ? { user_id: idSchema.parse(userId) } : {})
      .sort({ created_at: -1 })
      .toArray();
  } catch {
    return null;
  }
}

export async function getSavedAlertById(
  id: string,
): Promise<SavedAlert | null> {
  try {
    return await alerts.findOne({ _id: idSchema.parse(id) });
  } catch {
    return null;
  }
}

export async function createSavedAlert(
  input: SavedAlertCreate,
): Promise<SavedAlert | null> {
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
  } catch {
    return null;
  }
}

export async function updateSavedAlert(
  id: string,
  input: SavedAlertUpdate,
): Promise<SavedAlert | null> {
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
  } catch {
    return null;
  }
}

export async function deleteSavedAlert(id: string): Promise<boolean | null> {
  try {
    const result = await alerts.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch {
    return null;
  }
}

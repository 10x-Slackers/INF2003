import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  createSavedAlertSchema,
  idSchema,
  updateSavedAlertSchema,
  type SavedAlertUpdate,
  type SavedAlert,
  type SavedAlertCreate,
} from "./types";
import { handleDbError } from "@/lib/db-errors";
import { now } from "@/lib/utils";

const alerts = db.collection<SavedAlert>("alerts");

export async function listSavedAlerts(userId?: string): Promise<SavedAlert[]> {
  try {
    return await alerts
      .find(userId ? { userId: idSchema.parse(userId) } : {})
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getSavedAlertById(
  id: string,
): Promise<SavedAlert | null> {
  try {
    return await alerts.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function createSavedAlert(
  input: SavedAlertCreate,
): Promise<SavedAlert> {
  try {
    const data = createSavedAlertSchema.parse(input);
    const timestamp = now();
    const alert: SavedAlert = {
      _id: randomUUID(),
      userId: data.userId,
      filters: data.filters,
      isActive: data.isActive ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await alerts.insertOne(alert);
    return alert;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateSavedAlert(
  input: SavedAlertUpdate,
): Promise<SavedAlert | null> {
  try {
    const params = updateSavedAlertSchema.parse(input);
    const result = await alerts.findOneAndUpdate(
      { _id: params.id },
      {
        $set: {
          ...Object.fromEntries(
            Object.entries(params).filter(
              ([key, value]) => key !== "id" && value !== undefined,
            ),
          ),
          updatedAt: now(),
        },
      },
      { returnDocument: "after" },
    );

    return result;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteSavedAlert(id: string): Promise<boolean> {
  try {
    const result = await alerts.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleDbError(error);
  }
}

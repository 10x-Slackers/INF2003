import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  createSavedAlertSchema,
  alertTransactionFilterSchema,
  idSchema,
  updateSavedAlertSchema,
  type AlertTransactionFilter,
  type SavedAlertUpdate,
  type SavedAlert,
  type SavedAlertCreate,
} from "./types";
import { handleDbError, now } from "@/lib/utils";

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

type RangeFilterValue = { min: number; max: number } | number;
function addRangeFilter(
  query: Record<string, unknown>,
  field: string,
  value: RangeFilterValue,
) {
  const clauses = (query.$and ??= []) as Record<string, unknown>[];
  const minBound = typeof value === "number" ? value : value.max;
  const maxBound = typeof value === "number" ? value : value.min;
  clauses.push(
    {
      $or: [
        { [`${field}.min`]: { $exists: false } },
        { [`${field}.min`]: { $lte: minBound } },
      ],
    },
    {
      $or: [
        { [`${field}.max`]: { $exists: false } },
        { [`${field}.max`]: { $gte: maxBound } },
      ],
    },
  );
}

export async function findAlertsByTransaction(filters: AlertTransactionFilter) {
  try {
    const data = alertTransactionFilterSchema.parse(filters);
    const query: Record<string, unknown> = {};
    query.isActive = true;
    if (data.townId) query["filters.townId"] = data.townId;
    if (data.flatTypeId) query["filters.flatTypeId"] = String(data.flatTypeId);
    if (data.flatModelId) {
      query["filters.flatModelId"] = String(data.flatModelId);
    }
    if (data.price) addRangeFilter(query, "filters.price", data.price);
    if (data.floorAreaSqm) {
      addRangeFilter(query, "filters.floorAreaSqm", data.floorAreaSqm);
    }
    if (data.storey) {
      addRangeFilter(query, "filters.storey", data.storey);
    }
    if (data.leaseRemaining) {
      addRangeFilter(query, "filters.leaseRemaining", data.leaseRemaining);
    }

    return (await alerts.find(query).toArray()).map((alert) => ({
      userId: alert.userId,
      alertId: alert._id,
    }));
  } catch (error) {
    return handleDbError(error);
  }
}

export async function triggerSavedAlerts(alertIds: string[]): Promise<void> {
  try {
    const parsedIds = alertIds.map((id) => idSchema.parse(id));
    await alerts.updateMany(
      { _id: { $in: parsedIds } },
      { $set: { lastTriggeredAt: now() } },
    );
  } catch (error) {
    return handleDbError(error);
  }
}

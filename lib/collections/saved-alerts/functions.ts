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

function addFilterClause(
  query: Record<string, unknown>,
  clause: Record<string, unknown>,
) {
  const clauses = (query.$and ??= []) as Record<string, unknown>[];
  clauses.push(clause);
}

function addArrayFilter(
  query: Record<string, unknown>,
  field: string,
  value: string,
) {
  addFilterClause(query, {
    $or: [
      { [field]: value },
      { [field]: { $exists: false } },
      { [field]: { $size: 0 } },
    ],
  });
}

function addRangeOverlapFilter(
  query: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
) {
  // The range overlaps if either of the following is true:
  // alertMin <= transactionMax 1 <= 3 true
  // alertMax >= transactionMin 2 >= 1 true
  addFilterClause(query, {
    $or: [
      { [`${field}.min`]: { $exists: false } },
      { [`${field}.min`]: { $lte: max } },
    ],
  });
  addFilterClause(query, {
    $or: [
      { [`${field}.max`]: { $exists: false } },
      { [`${field}.max`]: { $gte: min } },
    ],
  });
}

function addValueInRangeFilter(
  query: Record<string, unknown>,
  field: string,
  value: number,
) {
  addFilterClause(query, {
    $or: [
      { [`${field}.min`]: { $exists: false } },
      { [`${field}.min`]: { $lte: value } },
    ],
  });
  addFilterClause(query, {
    $or: [
      { [`${field}.max`]: { $exists: false } },
      { [`${field}.max`]: { $gte: value } },
    ],
  });
}

export async function findAlertsByTransaction(filters: AlertTransactionFilter) {
  try {
    const data = alertTransactionFilterSchema.parse(filters);
    const query: Record<string, unknown> = {};
    query.isActive = true;
    if (data.townId) addArrayFilter(query, "filters.townId", data.townId);
    if (data.flatTypeId) {
      addArrayFilter(query, "filters.flatTypeId", String(data.flatTypeId));
    }
    if (data.flatModelId) {
      addArrayFilter(query, "filters.flatModelId", String(data.flatModelId));
    }
    if (data.price) addValueInRangeFilter(query, "filters.price", data.price);
    if (data.floorAreaSqm) {
      addValueInRangeFilter(query, "filters.floorAreaSqm", data.floorAreaSqm);
    }
    if (data.storey) {
      addRangeOverlapFilter(
        query,
        "filters.storey",
        data.storey.min,
        data.storey.max,
      );
    }
    if (data.leaseRemaining) {
      addValueInRangeFilter(
        query,
        "filters.leaseRemaining",
        data.leaseRemaining,
      );
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

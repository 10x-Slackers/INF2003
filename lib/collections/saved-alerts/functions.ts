import {
  db,
  findById,
  deleteDocById,
  createWithUuid,
  withMongoError,
} from "@/lib/db/mongodb";
import {
  createSavedAlertSchema,
  alertTransactionFilterSchema,
  idSchema,
  type AlertTransactionFilter,
  type SavedAlert,
  type SavedAlertCreate,
} from "./types";
import { now } from "@/lib/utils";

const alerts = db.collection<SavedAlert>("alerts");

export async function listSavedAlerts(userId?: string): Promise<SavedAlert[]> {
  return withMongoError(async () => {
    return await alerts
      .find(userId ? { userId: idSchema.parse(userId) } : {})
      .sort({ createdAt: -1 })
      .toArray();
  });
}

export async function getSavedAlertById(
  id: string,
): Promise<SavedAlert | null> {
  return findById(alerts, idSchema.parse(id));
}

export async function createSavedAlert(
  input: SavedAlertCreate,
): Promise<SavedAlert> {
  const data = createSavedAlertSchema.parse(input);
  const timestamp = now();
  return createWithUuid(alerts, {
    userId: data.userId,
    filters: data.filters,
    isActive: data.isActive ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function deleteSavedAlert(id: string): Promise<boolean> {
  return deleteDocById(alerts, idSchema.parse(id));
}

function addFilterClause(
  query: Record<string, unknown>,
  clause: Record<string, unknown>,
) {
  const clauses = (query.$and ?? (query.$and = [])) as Record<
    string,
    unknown
  >[];
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
  // Two ranges overlap if alert.min <= transaction.max AND alert.max >= transaction.min (or either bound is missing, meaning no constraint on that side)
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

export async function findAlertsByTransaction(
  filters: AlertTransactionFilter,
): Promise<{ userId: string; alertId: string }[]> {
  return withMongoError(async () => {
    const data = alertTransactionFilterSchema.parse(filters);
    const query: Record<string, unknown> = {};
    query.isActive = true;
    if (data.townId) addArrayFilter(query, "filters.townId", data.townId);
    if (data.flatTypeId !== undefined) {
      addArrayFilter(query, "filters.flatTypeId", String(data.flatTypeId));
    }
    if (data.flatModelId !== undefined) {
      addArrayFilter(query, "filters.flatModelId", String(data.flatModelId));
    }
    if (data.price !== undefined)
      addValueInRangeFilter(query, "filters.price", data.price);
    if (data.floorAreaSqm !== undefined) {
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
    if (data.leaseRemaining !== undefined) {
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
  });
}

export async function triggerSavedAlerts(alertIds: string[]): Promise<void> {
  return withMongoError(async () => {
    const parsedIds = alertIds.map((id) => idSchema.parse(id));
    await alerts.updateMany(
      { _id: { $in: parsedIds } },
      { $set: { lastTriggeredAt: now() } },
    );
  });
}

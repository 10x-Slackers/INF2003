import {
  execute,
  query,
  isDuplicateKeyError,
  isMissingReferenceError,
  isReferencedByOthersError,
} from "@/lib/db";
import { getTownById, listAllAmenitiesByTown } from "@/lib/domain/towns";
import type {
  CreatePropertyPayload,
  Property,
  PropertyDetail,
  PropertyWithLatestTransaction,
} from "@/lib/types";

// Each property is joined to its latest transaction (by transaction_month)
// via a correlated subquery, so list filters on flat_type/price act on that
// latest transaction rather than the property's full transaction history.
const LATEST_TRANSACTION_JOIN = `
  LEFT JOIN resale_transactions lt ON lt.id = (
    SELECT rt2.id FROM resale_transactions rt2
    WHERE rt2.property_id = p.id
    ORDER BY rt2.transaction_month DESC, rt2.id DESC
    LIMIT 1
  )
  LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
`;

// Column list for a property plus its latest transaction; must stay in sync
// with PropertyRow and toPropertyWithLatestTransaction.
const PROPERTY_WITH_LATEST_TRANSACTION_COLUMNS = `
  p.id, p.town_id, p.block, p.street_name, p.lease_commence_year,
  lt.id AS lt_id, lt.flat_type_id AS lt_flat_type_id,
  lft.name AS lt_flat_type_name, lt.resale_price AS lt_resale_price,
  lt.transaction_month AS lt_transaction_month
`;

type PropertyRow = {
  id: string;
  town_id: string;
  block: string;
  street_name: string;
  lease_commence_year: number;
  lt_id: string | null;
  lt_flat_type_id: number | null;
  lt_flat_type_name: string | null;
  lt_resale_price: number | null;
  lt_transaction_month: string | null;
};

function toPropertyWithLatestTransaction(
  row: PropertyRow,
): PropertyWithLatestTransaction {
  const {
    lt_id,
    lt_flat_type_id,
    lt_flat_type_name,
    lt_resale_price,
    lt_transaction_month,
    ...property
  } = row;
  return {
    ...property,
    latest_transaction:
      lt_id !== null
        ? {
            id: lt_id,
            flat_type_id: lt_flat_type_id!,
            flat_type: lt_flat_type_name!,
            resale_price: lt_resale_price!,
            transaction_month: lt_transaction_month!,
          }
        : null,
  };
}

export async function getPropertiesWithLatestTransaction(
  propertyIds: string[],
): Promise<PropertyWithLatestTransaction[]> {
  if (propertyIds.length === 0) return [];

  const placeholders = propertyIds.map(() => "?").join(", ");
  const rows = await query<PropertyRow>(
    `SELECT ${PROPERTY_WITH_LATEST_TRANSACTION_COLUMNS}
     FROM properties p
     ${LATEST_TRANSACTION_JOIN}
     WHERE p.id IN (${placeholders})`,
    propertyIds,
  );

  return rows.map(toPropertyWithLatestTransaction);
}

export async function listProperties(filters: {
  town_id?: string;
  flat_type?: string;
  price_min?: number;
  price_max?: number;
  page: number;
  pageSize: number;
}): Promise<{ data: PropertyWithLatestTransaction[]; total: number }> {
  const { page, pageSize } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.town_id !== undefined) {
    conditions.push("p.town_id = ?");
    params.push(filters.town_id);
  }
  if (filters.flat_type !== undefined) {
    conditions.push("lft.name = ?");
    params.push(filters.flat_type);
  }
  if (filters.price_min !== undefined) {
    conditions.push("lt.resale_price >= ?");
    params.push(filters.price_min);
  }
  if (filters.price_max !== undefined) {
    conditions.push("lt.resale_price <= ?");
    params.push(filters.price_max);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // The count only needs the latest-transaction join when a filter references
  // its columns (flat_type/price); otherwise the correlated subquery would run
  // per property just to count rows. The data query always needs it for SELECT.
  const countJoin =
    filters.flat_type !== undefined ||
    filters.price_min !== undefined ||
    filters.price_max !== undefined
      ? LATEST_TRANSACTION_JOIN
      : "";

  const [rows, countRows] = await Promise.all([
    query<PropertyRow>(
      `SELECT ${PROPERTY_WITH_LATEST_TRANSACTION_COLUMNS}
       FROM properties p
       ${LATEST_TRANSACTION_JOIN}
       ${where}
       ORDER BY p.block, p.street_name
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM properties p ${countJoin} ${where}`,
      params,
    ),
  ]);

  return {
    data: rows.map(toPropertyWithLatestTransaction),
    total: countRows[0].total,
  };
}

async function getPropertyRowById(id: string): Promise<Property | null> {
  const rows = await query<Property>(
    "SELECT id, town_id, block, street_name, lease_commence_year FROM properties WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

export async function getPropertyById(
  id: string,
): Promise<PropertyDetail | null> {
  const property = await getPropertyRowById(id);
  if (!property) return null;

  const [town, amenities] = await Promise.all([
    getTownById(property.town_id),
    listAllAmenitiesByTown(property.town_id),
  ]);

  return { ...property, town, amenities };
}

export async function lookupProperty(criteria: {
  town_id: string;
  block: string;
  street_name: string;
  lease_commence_year: number;
}): Promise<{ found: boolean; property_id?: string }> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM properties
     WHERE town_id = ? AND block = ? AND street_name = ? AND lease_commence_year = ?
     LIMIT 1`,
    [
      criteria.town_id,
      criteria.block,
      criteria.street_name,
      criteria.lease_commence_year,
    ],
  );

  const property = rows[0];
  return property
    ? { found: true, property_id: property.id }
    : { found: false };
}

export async function createProperty(
  payload: CreatePropertyPayload,
): Promise<Property> {
  try {
    await execute(
      "INSERT INTO properties (town_id, block, street_name, lease_commence_year) VALUES (?, ?, ?, ?)",
      [
        payload.town_id,
        payload.block,
        payload.street_name,
        payload.lease_commence_year,
      ],
    );
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new Error("Property already exists");
    }
    if (isMissingReferenceError(err)) {
      throw new Error("Invalid town_id");
    }
    throw err;
  }

  const { property_id } = await lookupProperty(payload);
  const property = property_id ? await getPropertyById(property_id) : null;
  if (!property) {
    throw new Error("Failed to read back created property");
  }
  return property;
}

export async function deleteProperty(id: string): Promise<boolean> {
  try {
    const result = await execute("DELETE FROM properties WHERE id = ?", [id]);
    return result.affectedRows > 0;
  } catch (err) {
    if (isReferencedByOthersError(err)) {
      throw new Error("Property has resale transactions and cannot be deleted");
    }
    throw err;
  }
}

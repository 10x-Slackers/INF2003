import {
  execute,
  query,
  queryOne,
  executeReturning,
  addCondition,
  addInCondition,
  buildUpdateFields,
  deleteById,
  isEmptyUpdate,
} from "@/lib/db";
import type { Amenity } from "@/lib/tables/amenities";
import { regionSchema } from "@/lib/tables/towns";
import { withDbError } from "@/lib/utils";
import {
  createPropertySchema,
  propertyListQuerySchema,
  updatePropertyParamsSchema,
  updatePropertySchema,
  type CreateProperty,
  type Property,
  type PropertyDetail,
  type PropertyListQuery,
  type PropertySearchResult,
  type PropertyWithLatestTransaction,
  type UpdatePropertyParams,
} from "./types";
import { idSchema } from "../common";

const LATEST_TRANSACTION_JOIN = `
  LEFT JOIN (
    SELECT rt2.*, ROW_NUMBER() OVER (
      PARTITION BY rt2.property_id
      ORDER BY rt2.transaction_month DESC, rt2.id DESC
    ) AS rn
    FROM resale_transactions rt2
  ) lt ON lt.property_id = p.id AND lt.rn = 1
  LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
  LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
  LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
`;

const TOWN_JOIN = `
  JOIN towns t ON t.id = p.town_id
`;

const PROPERTY_WITH_LATEST_TRANSACTION_COLUMNS = `
  p.id, p.town_id, p.block, p.street_name, p.lease_commence_year, t.name AS town_name,
  lt.id AS lt_id, lt.uploaded_by_user_id AS lt_uploaded_by_user_id,
  lt.property_id AS lt_property_id, lt.flat_type_id AS lt_flat_type_id,
  lt.flat_model_id AS lt_flat_model_id, lt.storey_range_id AS lt_storey_range_id,
  lt.floor_area_sqm AS lt_floor_area_sqm,
  lft.name AS lt_flat_type_name, lfm.name AS lt_flat_model_name,
  lsr.min_storey AS lt_min_storey, lsr.max_storey AS lt_max_storey,
  lt.resale_price AS lt_resale_price,
  lt.transaction_month AS lt_transaction_month
`;

type PropertyRow = Property & {
  town_name: string;
  lt_id: string | null;
  lt_uploaded_by_user_id: string | null;
  lt_property_id: string | null;
  lt_flat_type_id: number | null;
  lt_flat_model_id: number | null;
  lt_storey_range_id: number | null;
  lt_floor_area_sqm: number | null;
  lt_flat_type_name: string | null;
  lt_flat_model_name: string | null;
  lt_min_storey: number | null;
  lt_max_storey: number | null;
  lt_resale_price: number | null;
  lt_transaction_month: string | null;
};

function toPropertyWithLatestTransaction(
  row: PropertyRow,
): PropertyWithLatestTransaction {
  const {
    lt_id,
    lt_uploaded_by_user_id,
    lt_property_id,
    lt_flat_type_id,
    lt_flat_model_id,
    lt_storey_range_id,
    lt_floor_area_sqm,
    lt_flat_type_name,
    lt_flat_model_name,
    lt_min_storey,
    lt_max_storey,
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
            uploaded_by_user_id: lt_uploaded_by_user_id,
            property_id: lt_property_id!,
            flat_type_id: lt_flat_type_id!,
            flat_model_id: lt_flat_model_id!,
            storey_range_id: lt_storey_range_id!,
            floor_area_sqm: lt_floor_area_sqm!,
            flat_type: lt_flat_type_name!,
            flat_model: lt_flat_model_name!,
            min_storey: lt_min_storey!,
            max_storey: lt_max_storey!,
            resale_price: lt_resale_price!,
            transaction_month: lt_transaction_month!,
          }
        : null,
  };
}

export async function getPropertiesWithLatestTransaction(
  propertyIds: string[],
): Promise<PropertyWithLatestTransaction[]> {
  return withDbError(async () => {
    const ids = idSchema.array().parse(propertyIds);
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(", ");
    const rows = await query<PropertyRow>(
      `SELECT ${PROPERTY_WITH_LATEST_TRANSACTION_COLUMNS}
     FROM properties p
     ${LATEST_TRANSACTION_JOIN}
     ${TOWN_JOIN}
     WHERE p.id IN (${placeholders})`,
      ids,
    );

    return rows.map(toPropertyWithLatestTransaction);
  });
}

export async function searchPropertiesByAddress(
  search: string,
  limit = 20,
): Promise<PropertySearchResult[]> {
  const term = search.trim();
  if (term.length < 2) return [];
  return withDbError(async () => {
    return await query<PropertySearchResult>(
      `SELECT p.id AS id, p.block AS block, p.street_name AS street_name,
              p.town_id AS town_id, t.name AS town_name
       FROM properties p
       JOIN towns t ON t.id = p.town_id
       WHERE p.block LIKE ? OR p.street_name LIKE ? OR t.name LIKE ?
       ORDER BY p.block, p.street_name
       LIMIT ?`,
      [`%${term}%`, `%${term}%`, `%${term}%`, limit],
    );
  });
}

export async function listProperties(
  filters: PropertyListQuery,
): Promise<{ data: PropertyWithLatestTransaction[]; total: number }> {
  return withDbError(async () => {
    const data = propertyListQuerySchema.parse(filters);
    const { page, pageSize } = data;
    const conditions: string[] = [];
    const params: unknown[] = [];

    addInCondition(conditions, params, data.town_ids, "p.town_id");
    if (data.street_name !== undefined) {
      conditions.push("p.street_name LIKE ?");
      params.push(`%${data.street_name}%`);
    }
    if (data.block !== undefined) {
      conditions.push("p.block LIKE ?");
      params.push(`%${data.block}%`);
    }
    addCondition(
      conditions,
      params,
      data.lease_commence_year,
      "p.lease_commence_year",
      "=",
    );
    addInCondition(conditions, params, data.flat_type_ids, "lt.flat_type_id");
    addInCondition(conditions, params, data.flat_model_ids, "lt.flat_model_id");
    addCondition(conditions, params, data.price_min, "lt.resale_price", ">=");
    addCondition(conditions, params, data.price_max, "lt.resale_price", "<=");

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countJoin =
      data.flat_type_ids?.length ||
      data.flat_model_ids?.length ||
      data.price_min !== undefined ||
      data.price_max !== undefined
        ? LATEST_TRANSACTION_JOIN
        : "";

    const [rows, countRows] = await Promise.all([
      query<PropertyRow>(
        `SELECT ${PROPERTY_WITH_LATEST_TRANSACTION_COLUMNS}
       FROM properties p
       ${LATEST_TRANSACTION_JOIN}
       ${TOWN_JOIN}
       ${where}
       ORDER BY p.lease_commence_year DESC, p.block, p.street_name
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
  });
}

export async function getPropertyRowById(id: string): Promise<Property | null> {
  return withDbError(() =>
    queryOne<Property>(
      "SELECT id, town_id, block, street_name, lease_commence_year FROM properties WHERE id = ? LIMIT 1",
      [idSchema.parse(id)],
    ),
  );
}

export async function getPropertyById(
  id: string,
): Promise<PropertyDetail | null> {
  return withDbError(async () => {
    const parsedId = idSchema.parse(id);
    const rows = await query<Property & { region: string; town_name: string }>(
      `SELECT p.id, p.town_id, p.block, p.street_name, p.lease_commence_year,
              t.name AS town_name, t.region
       FROM properties p
       JOIN towns t ON t.id = p.town_id
       WHERE p.id = ? LIMIT 1`,
      [parsedId],
    );

    if (rows.length === 0) return null;
    const row = rows[0];
    const amenities = await query<Amenity>(
      `SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
       FROM amenities WHERE town_id = ? ORDER BY name`,
      [row.town_id],
    );

    return {
      id: row.id,
      town_id: row.town_id,
      block: row.block,
      street_name: row.street_name,
      lease_commence_year: row.lease_commence_year,
      town: {
        id: row.town_id,
        name: row.town_name,
        region: regionSchema.parse(row.region),
      },
      amenities,
    };
  });
}

export async function createProperty(input: CreateProperty): Promise<string> {
  return withDbError(async () => {
    const data = createPropertySchema.parse(input);
    const result = await executeReturning<{ id: string }>(
      "INSERT INTO properties (town_id, block, street_name, lease_commence_year) VALUES (?, ?, ?, ?) RETURNING id",
      [data.town_id, data.block, data.street_name, data.lease_commence_year],
    );
    return result[0].id;
  });
}

export async function updateProperty(
  input: UpdatePropertyParams,
): Promise<Property | null> {
  return withDbError(async () => {
    const parsed = updatePropertyParamsSchema.parse(input);
    if (isEmptyUpdate(parsed.input)) return getPropertyRowById(parsed.id);

    const data = updatePropertySchema.parse(parsed.input);
    const { setClause, params } = buildUpdateFields(data);
    const result = await execute(
      `UPDATE properties SET ${setClause} WHERE id = ?`,
      [...params, parsed.id] as (string | number)[],
    );
    return result.affectedRows === 0 ? null : getPropertyRowById(parsed.id);
  });
}

export async function deleteProperty(id: string): Promise<boolean> {
  return deleteById("properties", id);
}

export async function lookupProperty(
  input: CreateProperty,
): Promise<{ found: boolean; property_id?: string }> {
  return withDbError(async () => {
    const data = createPropertySchema.parse(input);
    const rows = await query<{ id: string }>(
      `SELECT id FROM properties
     WHERE town_id = ? AND block = ? AND street_name = ? AND lease_commence_year = ?
     LIMIT 1`,
      [data.town_id, data.block, data.street_name, data.lease_commence_year],
    );

    return rows[0]
      ? { found: true, property_id: rows[0].id }
      : { found: false };
  });
}

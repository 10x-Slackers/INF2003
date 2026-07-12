# Property Functions

Source: `lib/tables/properties/functions.ts`

## `listProperties(filters)`

```sql
SELECT p.id, p.town_id, p.block, p.street_name, p.lease_commence_year,
       lt.id AS lt_id, lt.uploaded_by_user_id AS lt_uploaded_by_user_id,
       lt.property_id AS lt_property_id, lt.flat_type_id AS lt_flat_type_id,
       lt.flat_model_id AS lt_flat_model_id, lt.storey_range_id AS lt_storey_range_id,
       lt.floor_area_sqm AS lt_floor_area_sqm,
       lft.name AS lt_flat_type_name, lfm.name AS lt_flat_model_name,
       lsr.min_storey AS lt_min_storey, lsr.max_storey AS lt_max_storey,
       lt.resale_price AS lt_resale_price,
       lt.transaction_month AS lt_transaction_month
FROM properties p
LEFT JOIN towns t ON t.id = p.town_id
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
WHERE p.town_id IN (?) AND p.street_name LIKE ? AND p.block LIKE ? AND p.lease_commence_year = ?
  AND lt.flat_type_id IN (?) AND lt.flat_model_id IN (?)
  AND lt.resale_price >= ? AND lt.resale_price <= ?
ORDER BY p.lease_commence_year DESC, p.block, p.street_name
LIMIT ? OFFSET ?;
```

Optional params: `town_ids`, `street_name`, `block`, `lease_commence_year`, `flat_type_ids`, `flat_model_ids`, `price_min`, `price_max`.
Params: `page`, `pageSize`.
Only provided filters are included in `WHERE`.

Returned columns: `id, town_id, block, street_name, lease_commence_year, lt_id, lt_uploaded_by_user_id, lt_property_id, lt_flat_type_id, lt_flat_model_id, lt_storey_range_id, lt_floor_area_sqm, lt_flat_type_name, lt_flat_model_name, lt_min_storey, lt_max_storey, lt_resale_price, lt_transaction_month`

```sql
SELECT COUNT(*) AS total
FROM properties p
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
WHERE p.town_id IN (?) AND p.street_name LIKE ? AND p.block LIKE ? AND p.lease_commence_year = ?
  AND lt.flat_type_id IN (?) AND lt.flat_model_id IN (?)
  AND lt.resale_price >= ? AND lt.resale_price <= ?;
```

Optional params: `town_ids`, `street_name`, `block`, `lease_commence_year`, `flat_type_ids`, `flat_model_ids`, `price_min`, `price_max`.
Only provided filters are included in `WHERE`. The latest-transaction joins are included in the count query only when filtering by latest transaction fields (`flat_type_ids`, `flat_model_ids`, `price_min`, `price_max`). The town join is excluded from the count query (only needed for `town_name` in the data query).

Returned columns: `total`

## `getPropertyById(id)`

```sql
SELECT p.id, p.town_id, p.block, p.street_name, p.lease_commence_year,
       t.name AS town_name, t.region
FROM properties p
JOIN towns t ON t.id = p.town_id
WHERE p.id = ?
LIMIT 1;
```

Returned columns: `id, town_id, block, street_name, lease_commence_year, town_name, region`

## `createProperty(input)`

```sql
INSERT INTO properties (town_id, block, street_name, lease_commence_year)
VALUES (?, ?, ?, ?)
RETURNING id;
```

Returned columns: `id`

## `searchPropertiesByAddress(search, limit)`

```sql
SELECT p.id AS id, p.block AS block, p.street_name AS street_name,
       p.town_id AS town_id, t.name AS town_name
FROM properties p
JOIN towns t ON t.id = p.town_id
WHERE p.block LIKE ? OR p.street_name LIKE ? OR t.name LIKE ?
ORDER BY p.block, p.street_name
LIMIT ?;
```

Params: `search` (min 2 chars, else returns empty), `limit` (default 20).

Returned columns: `id, block, street_name, town_id, town_name`

## `getPropertyRowById(id)`

```sql
SELECT id, town_id, block, street_name, lease_commence_year FROM properties WHERE id = ? LIMIT 1;
```

Returned columns: `id, town_id, block, street_name, lease_commence_year`

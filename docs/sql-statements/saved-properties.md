# Saved Property Functions

Source: `lib/tables/saved-properties/functions.ts`

## `listSavedProperties(input)`

```sql
SELECT id, user_id, property_id, created_at
FROM saved_properties
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

Params: `page`, `pageSize`.

Returned columns: `id, user_id, property_id, created_at`

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
LEFT JOIN resale_transactions lt ON lt.id = (
  SELECT rt2.id
  FROM resale_transactions rt2
  WHERE rt2.property_id = p.id
  ORDER BY rt2.transaction_month DESC, rt2.id DESC
  LIMIT 1
)
LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
WHERE p.id IN (?);
```

Returned columns: `id, town_id, block, street_name, lease_commence_year, lt_id, lt_uploaded_by_user_id, lt_property_id, lt_flat_type_id, lt_flat_model_id, lt_storey_range_id, lt_floor_area_sqm, lt_flat_type_name, lt_flat_model_name, lt_min_storey, lt_max_storey, lt_resale_price, lt_transaction_month`

```sql
SELECT COUNT(*) AS total FROM saved_properties WHERE user_id = ?;
```

Returned columns: `total`

## `getSavedPropertyById(id)`

```sql
SELECT id, user_id, property_id, created_at FROM saved_properties WHERE id = ? LIMIT 1;
```

Returned columns: `id, user_id, property_id, created_at`

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
LEFT JOIN resale_transactions lt ON lt.id = (
  SELECT rt2.id
  FROM resale_transactions rt2
  WHERE rt2.property_id = p.id
  ORDER BY rt2.transaction_month DESC, rt2.id DESC
  LIMIT 1
)
LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
WHERE p.id IN (?);
```

Returned columns: `id, town_id, block, street_name, lease_commence_year, lt_id, lt_uploaded_by_user_id, lt_property_id, lt_flat_type_id, lt_flat_model_id, lt_storey_range_id, lt_floor_area_sqm, lt_flat_type_name, lt_flat_model_name, lt_min_storey, lt_max_storey, lt_resale_price, lt_transaction_month`

## `createSavedProperty(input)`

```sql
INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?);
```

Returned columns: `id` (via `executeReturning`)

## `updateSavedProperty(input)`

```sql
UPDATE saved_properties
SET user_id = ?, property_id = ?
WHERE id = ?;
```

Optional params: `userId`, `propertyId`. Only provided fields are included in `SET`.

```sql
SELECT id, user_id, property_id, created_at FROM saved_properties WHERE id = ? LIMIT 1;
```

Returned columns: `id, user_id, property_id, created_at`

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
LEFT JOIN resale_transactions lt ON lt.id = (
  SELECT rt2.id
  FROM resale_transactions rt2
  WHERE rt2.property_id = p.id
  ORDER BY rt2.transaction_month DESC, rt2.id DESC
  LIMIT 1
)
LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
WHERE p.id IN (?);
```

Returned columns: `id, town_id, block, street_name, lease_commence_year, lt_id, lt_uploaded_by_user_id, lt_property_id, lt_flat_type_id, lt_flat_model_id, lt_storey_range_id, lt_floor_area_sqm, lt_flat_type_name, lt_flat_model_name, lt_min_storey, lt_max_storey, lt_resale_price, lt_transaction_month`

## `deleteSavedProperty(id)`

```sql
DELETE FROM saved_properties WHERE id = ?;
```

## `isPropertySaved(input)`

```sql
SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ? LIMIT 1;
```

Returned columns: `id`

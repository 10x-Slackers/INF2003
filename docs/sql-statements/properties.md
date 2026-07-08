# Property Functions

Source: `lib/tables/properties/functions.ts`

## `getPropertiesWithLatestTransaction(propertyIds)`

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
WHERE p.town_id = ? AND lt.flat_type_id = ? AND lt.flat_model_id = ?
  AND lt.resale_price >= ? AND lt.resale_price <= ?
ORDER BY p.block, p.street_name
LIMIT ? OFFSET ?;
```

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `price_min`, `price_max`.
Params: `page`, `pageSize`.
Only provided filters are included in `WHERE`.

Returned columns: `id, town_id, block, street_name, lease_commence_year, lt_id, lt_uploaded_by_user_id, lt_property_id, lt_flat_type_id, lt_flat_model_id, lt_storey_range_id, lt_floor_area_sqm, lt_flat_type_name, lt_flat_model_name, lt_min_storey, lt_max_storey, lt_resale_price, lt_transaction_month`

```sql
SELECT COUNT(*) AS total
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
WHERE p.town_id = ? AND lt.flat_type_id = ? AND lt.flat_model_id = ?
  AND lt.resale_price >= ? AND lt.resale_price <= ?;
```

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `price_min`, `price_max`.
Only provided filters are included in `WHERE`. The latest-transaction joins are included in the count query only when filtering by latest transaction fields.

Returned columns: `total`

## `getPropertyById(id)`

```sql
SELECT id, town_id, block, street_name, lease_commence_year
FROM properties
WHERE id = ?
LIMIT 1;
```

Returned columns: `id, town_id, block, street_name, lease_commence_year`

```sql
SELECT id, region, name FROM towns WHERE id = ? LIMIT 1;
```

Returned columns: `id, region, name`

```sql
SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
FROM amenities
WHERE town_id = ?
ORDER BY name;
```

Returned columns: `id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude`

## `createProperty(input)`

```sql
INSERT INTO properties (town_id, block, street_name, lease_commence_year)
VALUES (?, ?, ?, ?)
RETURNING id;
```

Returned columns: `id`

## `updateProperty(input)`

```sql
UPDATE properties
SET town_id = ?, block = ?, street_name = ?, lease_commence_year = ?
WHERE id = ?;
```

Optional params: `town_id`, `block`, `street_name`, `lease_commence_year`.
Only provided fields are included in `SET`.

```sql
SELECT id, town_id, block, street_name, lease_commence_year
FROM properties
WHERE id = ?
LIMIT 1;
```

Returned columns: `id, town_id, block, street_name, lease_commence_year`

## `deleteProperty(id)`

```sql
DELETE FROM properties WHERE id = ?;
```

## `lookupProperty(input)`

```sql
SELECT id
FROM properties
WHERE town_id = ? AND block = ? AND street_name = ? AND lease_commence_year = ?
LIMIT 1;
```

Returned columns: `id`

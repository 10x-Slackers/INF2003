# Saved Property Functions

Source: `lib/tables/saved-properties/functions.ts`

## `listSavedProperties(userId)`

```sql
SELECT sp.id, sp.user_id, sp.property_id, sp.created_at,
       p.id AS p_id, p.town_id AS p_town_id, p.block AS p_block,
       p.street_name AS p_street_name,
       p.lease_commence_year AS p_lease_commence_year,
       t.name AS town_name,
       lt.id AS lt_id, lt.uploaded_by_user_id AS lt_uploaded_by_user_id,
       lt.property_id AS lt_property_id, lt.flat_type_id AS lt_flat_type_id,
       lt.flat_model_id AS lt_flat_model_id, lt.storey_range_id AS lt_storey_range_id,
       lt.floor_area_sqm AS lt_floor_area_sqm,
       lft.name AS lt_flat_type_name, lfm.name AS lt_flat_model_name,
       lsr.min_storey AS lt_min_storey, lsr.max_storey AS lt_max_storey,
       lt.resale_price AS lt_resale_price,
       lt.transaction_month AS lt_transaction_month
FROM saved_properties sp
LEFT JOIN properties p ON p.id = sp.property_id
LEFT JOIN towns t ON t.id = p.town_id
LEFT JOIN (
  SELECT rt.*, ROW_NUMBER() OVER (
    PARTITION BY rt.property_id
    ORDER BY rt.transaction_month DESC, rt.id DESC
  ) AS rn
  FROM resale_transactions rt
) lt ON lt.property_id = p.id AND lt.rn = 1
LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
WHERE sp.user_id = ?
ORDER BY sp.created_at DESC;
```

Returned columns: `id, user_id, property_id, created_at, p_id, p_town_id, p_block, p_street_name, p_lease_commence_year, town_name, lt_id, lt_uploaded_by_user_id, lt_property_id, lt_flat_type_id, lt_flat_model_id, lt_storey_range_id, lt_floor_area_sqm, lt_flat_type_name, lt_flat_model_name, lt_min_storey, lt_max_storey, lt_resale_price, lt_transaction_month`

## `createSavedProperty(input)`

```sql
INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?) RETURNING id;
```

Returned columns: `id`

## `isPropertySaved(input)`

```sql
SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ? LIMIT 1;
```

Returned columns: `id`

## `deleteSavedPropertyByUserAndProperty(input)`

```sql
DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?;
```

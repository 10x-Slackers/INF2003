# Amenity Functions

Source: `lib/tables/amenities/functions.ts`

## `listAmenities(filters)`

```sql
SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
FROM amenities
WHERE town_id = ? AND amenity_type_id = ?
ORDER BY name
LIMIT ? OFFSET ?;
```

Optional params: `town_id`, `amenity_type_id`
params: `page`, `pageSize`.

Returned columns: `id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude`

```sql
SELECT COUNT(*) AS total
FROM amenities
WHERE town_id = ? AND amenity_type_id = ?;
```

Optional params: `town_id`, `amenity_type_id`.

Returned columns: `total`

## `getAmenityById(id)`

```sql
SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
FROM amenities
WHERE id = ?
LIMIT 1;
```

Returned columns: `id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude`

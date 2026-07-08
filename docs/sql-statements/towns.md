# Town Functions

Source: `lib/tables/towns/functions.ts`

## `listTowns(input)`

```sql
SELECT id, region, name
FROM towns
WHERE region = ?
ORDER BY name LIMIT ? OFFSET ?;
```

Optional params: `region`.
Params: `page`, `pageSize`.

Returned columns: `id, region, name`

```sql
SELECT COUNT(*) AS total FROM towns WHERE region = ?;
```

Optional params: `region`.

Returned columns: `total`

## `getTownById(id)`

```sql
SELECT id, region, name FROM towns WHERE id = ? LIMIT 1;
```

Returned columns: `id, region, name`

## `listPropertiesByTown(input)`

```sql
SELECT id, town_id, block, street_name, lease_commence_year
FROM properties
WHERE town_id = ?
ORDER BY block, street_name
LIMIT ? OFFSET ?;
```

Params: `page`, `pageSize`.

Returned columns: `id, town_id, block, street_name, lease_commence_year`

```sql
SELECT COUNT(*) AS total FROM properties WHERE town_id = ?;
```

Returned columns: `total`

## `listAllAmenitiesByTown(townId)`

```sql
SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
FROM amenities
WHERE town_id = ?
ORDER BY name;
```

Returned columns: `id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude`

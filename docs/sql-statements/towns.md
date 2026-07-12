# Town Functions

Source: `lib/tables/towns/functions.ts`

## `listTowns()`

```sql
SELECT id, region, name
FROM towns
ORDER BY name;
```

Returned columns: `id, region, name`

## `getTownById(id)`

```sql
SELECT id, region, name FROM towns WHERE id = ? LIMIT 1;
```

Returned columns: `id, region, name`

## `listAllAmenitiesByTown(townId)`

```sql
SELECT a.id, a.town_id, a.amenity_type_id, a.name, a.street_name, a.postal_code,
       a.longitude, a.latitude, at.name AS amenity_type_name
FROM amenities a
JOIN amenity_types at ON at.id = a.amenity_type_id
WHERE a.town_id = ?
ORDER BY at.name, a.name;
```

Returned columns: `id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude, amenity_type_name`

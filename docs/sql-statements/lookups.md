# Lookup Functions

Source: `lib/tables/lookups/functions.ts`

## `listFlatTypes()`

```sql
SELECT id, name FROM flat_types ORDER BY name;
```

Returned columns: `id, name`

## `listFlatModels()`

```sql
SELECT id, name FROM flat_models ORDER BY name;
```

Returned columns: `id, name`

## `listStoreyRanges()`

```sql
SELECT id, min_storey, max_storey FROM storey_ranges ORDER BY min_storey;
```

Returned columns: `id, min_storey, max_storey`

## `listAmenityTypes()`

```sql
SELECT id, name FROM amenity_types ORDER BY name;
```

Returned columns: `id, name`

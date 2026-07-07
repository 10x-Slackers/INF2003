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

params: `page`, `pageSize`.

Returned columns: `id, user_id, property_id, created_at`

```sql
SELECT COUNT(*) AS total FROM saved_properties WHERE user_id = ?;
```

Returned columns: `total`

## `getSavedPropertyById(id)`

```sql
SELECT id, user_id, property_id, created_at FROM saved_properties WHERE id = ? LIMIT 1;
```

Returned columns: `id, user_id, property_id, created_at`

## `createSavedProperty(input)`

```sql
INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?);
```

## `updateSavedProperty(input)`

```sql
UPDATE saved_properties SET user_id = ?, property_id = ? WHERE id = ?;
```

Optional params: `userId`, `propertyId`.

## `deleteSavedProperty(id)`

```sql
DELETE FROM saved_properties WHERE id = ?;
```

## `isPropertySaved(input)`

```sql
SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ? LIMIT 1;
```

Returned columns: `id`

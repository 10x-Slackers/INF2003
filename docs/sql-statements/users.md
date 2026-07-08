# User Functions

Source: `lib/tables/users/functions.ts`

## `listUsers(input)`

```sql
SELECT id, name, email, role, created_at, updated_at
FROM users
WHERE (name LIKE ? OR email LIKE ?)
ORDER BY created_at
LIMIT ? OFFSET ?;
```

Params: `page`, `pageSize`.
Optional params: `search`.

Returned columns: `id, name, email, role, created_at, updated_at`

```sql
SELECT COUNT(*) AS total
FROM users
WHERE (name LIKE ? OR email LIKE ?);
```

Optional params: `search`.

Returned columns: `total`

## `getUserById(id)`

```sql
SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1;
```

Returned columns: `id, name, email, role, created_at, updated_at`

## `getUserWithPasswordById(id)`

```sql
SELECT id, name, email, password_hash, role, created_at, updated_at
FROM users
WHERE id = ?
LIMIT 1;
```

Returned columns: `id, name, email, password_hash, role, created_at, updated_at`

## `createUser(input)`

```sql
INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?);
```

Optional params: `role`.

Defaults to `USER` before the query runs.

## `updateUser(input)`

```sql
UPDATE users
SET name = ?, email = ?, role = ?, password_hash = ?
WHERE id = ?;
```

Optional params: `name`, `email`, `role`, `password_hash`.

```sql
SELECT id, name, email, role, created_at, updated_at
FROM users
WHERE id = ?
LIMIT 1;
```

Returned columns: `id, name, email, role, created_at, updated_at`

## `deleteUser(id)`

```sql
DELETE FROM users WHERE id = ?;
```

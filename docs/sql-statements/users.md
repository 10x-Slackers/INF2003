# User Functions

Source: `lib/tables/users/functions.ts`

## `listUsers(input)`

```sql
SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at LIMIT ? OFFSET ?;
```

params: `page`, `pageSize`.

Returned columns: `id, name, email, role, created_at, updated_at`

```sql
SELECT COUNT(*) AS total FROM users;
```

Returned columns: `total`

## `getUserById(id)`

```sql
SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1;
```

Returned columns: `id, name, email, role, created_at, updated_at`

## `createUser(input)`

```sql
INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?);
```

Optional params: `role`; defaults to `USER` before the query runs.

Returned columns: none.

## `updateUser(input)`

```sql
UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?;
```

Optional params: `name`, `email`, `role`.

Returned columns: none.

## `deleteUser(id)`

```sql
DELETE FROM users WHERE id = ?;
```

Returned columns: none.

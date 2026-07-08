# Auth Functions

Source: `lib/auth/signup.ts`

## `signup(request)`

```sql
INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?);
```

Source: `lib/auth/index.ts`

## `authorize(credentials)`

```sql
SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1;
```

Returned columns: `id, name, email, password_hash, role`

## `jwt({ token, user, trigger })`

```sql
SELECT name, email, role FROM users WHERE id = ? LIMIT 1;
```

Returned columns: `name, email, role`

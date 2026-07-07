# Auth Functions

Sources: `lib/auth/signup.ts`, `lib/auth/index.ts`

## `signup(request)`

```sql
INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?);
```

Returned columns: none.

## `authorize(credentials)`

```sql
SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1;
```

Returned columns: `id, name, email, password_hash, role`

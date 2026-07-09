# Search Log Collection Functions

Source: `lib/collections/search-logs/functions.ts`

## `listSearchLogs(input)`

```js
db.searchHistory
  .find(userId ? { userId } : {})
  .sort({ searchedAt: -1 })
  .limit(limit ?? 50)
  .toArray();
```

Optional params: `userId`, `limit`
Returned fields: `_id, userId, query, searchedAt`

## `getSearchLogById(id)`

```js
db.searchHistory.findOne({ _id: id });
```

Returned fields: `_id, userId, query, searchedAt` or `null`

## `createSearchLog(input)`

```js
db.searchHistory.insertOne({
  _id,
  userId,
  query,
  searchedAt,
});
```

Returned fields: `_id, userId, query, searchedAt`

## `deleteSearchLog(id)`

```js
db.searchHistory.deleteOne({ _id: id });
```

Returned value: `boolean`

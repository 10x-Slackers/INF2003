# Search Log Collection Functions

Source: `lib/collections/search-logs/functions.ts`

Output examples use placeholder strings to show shape and type, not real data.

## `listSearchLogs(input)`

```js
db.searchHistory
  .find(userId ? { userId } : {})
  .sort({ searchedAt: -1 })
  .limit(limit ?? 50)
  .toArray();
```

Optional params: `userId`, `limit`.

Output:

```json
[
  {
    "_id": "<uuid>",
    "userId": "<uuid>",
    "query": {
      "townId": ["<uuid>"],
      "price": {
        "min": "<number>",
        "max": "<number>"
      }
    },
    "searchedAt": "<timestamp_ms>"
  }
]
```

## `getSearchLogById(id)`

```js
db.searchHistory.findOne({ _id: id });
```

Output:

```json
{
  "_id": "<uuid>",
  "userId": "<uuid>",
  "query": {
    "townId": ["<uuid>"],
    "price": {
      "min": "<number>",
      "max": "<number>"
    }
  },
  "searchedAt": "<timestamp_ms>"
}
```

Returns `null` when no document matches.

## `createSearchLog(input)`

```js
db.searchHistory.insertOne({
  _id,
  userId,
  query,
  searchedAt,
});
```

Output:

```json
{
  "_id": "<uuid>",
  "userId": "<uuid>",
  "query": {
    "townId": ["<uuid>"],
    "price": {
      "min": "<number>",
      "max": "<number>"
    }
  },
  "searchedAt": "<timestamp_ms>"
}
```

## `deleteSearchLog(id)`

```js
db.searchHistory.deleteOne({ _id: id });
```

Output: boolean, either `true` or `false`.

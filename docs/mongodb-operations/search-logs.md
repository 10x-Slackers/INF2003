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

`userId` may be `null` for anonymous searches.

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

Returns `null` when no document matches. `userId` may be `null` for anonymous searches.

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

`userId` may be `null` for anonymous searches. Available filter fields include `townId`, `flatTypeId`, `flatModelId`, `price`, and `leaseCommenceYear`.

## `deleteSearchLog(id)`

```js
db.searchHistory.deleteOne({ _id: id });
```

Output: boolean, either `true` or `false`.

---

# Search Stats Aggregation Functions

Source: `lib/collections/search-logs/stats.ts`

## `getTotalSearches()`

```js
db.searchHistory.countDocuments();
```

Output: number.

## `getTopTowns(limit = 10)`

```js
db.searchHistory.aggregate([
  { $match: { "query.townId": { $exists: true, $ne: [] } } },
  { $unwind: "$query.townId" },
  { $group: { _id: "$query.townId", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

Output:

```json
[{ "id": "<uuid>", "name": "<town_name>", "count": 42 }]
```

Town names resolved from MariaDB `towns` table via JS Map lookup.

## `getTopFlatTypes(limit = 10)`

```js
db.searchHistory.aggregate([
  { $match: { "query.flatTypeId": { $exists: true, $ne: [] } } },
  { $unwind: "$query.flatTypeId" },
  { $group: { _id: "$query.flatTypeId", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

Output:

```json
[{ "id": "1", "name": "<flat_type_name>", "count": 35 }]
```

Flat type names resolved from MariaDB `flat_types` table. The `_id` values are strings of numeric IDs; converted to numbers for MariaDB lookup.

## `getTopFlatModels(limit = 10)`

```js
db.searchHistory.aggregate([
  { $match: { "query.flatModelId": { $exists: true, $ne: [] } } },
  { $unwind: "$query.flatModelId" },
  { $group: { _id: "$query.flatModelId", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

Output:

```json
[{ "id": "2", "name": "<flat_model_name>", "count": 28 }]
```

Flat model names resolved from MariaDB `flat_models` table.

## `getPriceRangeStats()`

Fetches all documents with `query.price.min` or `query.price.max` set, then buckets them in JS:

```js
db.searchHistory.find(
  {
    $or: [
      { "query.price.min": { $exists: true } },
      { "query.price.max": { $exists: true } },
    ],
  },
  { projection: { "query.price": 1 } },
);
```

Ranges:

| Range         | Min       | Max       |
| ------------- | --------- | --------- |
| Under $400k   | 0         | 400,000   |
| $400k - $600k | 400,000   | 600,000   |
| $600k - $800k | 600,000   | 800,000   |
| $800k - $1M   | 800,000   | 1,000,000 |
| Over $1M      | 1,000,000 | Infinity  |

Output:

```json
[
  { "range": "Under $400k", "min": 0, "max": 400000, "count": 12 },
  { "range": "$400k - $600k", "min": 400000, "max": 600000, "count": 8 },
  { "range": "$600k - $800k", "min": 600000, "max": 800000, "count": 5 },
  { "range": "$800k - $1M", "min": 800000, "max": 1000000, "count": 3 },
  { "range": "Over $1M", "min": 1000000, "max": Infinity, "count": 2 }
]
```

## `getSearchStats()`

Runs all five aggregation functions in parallel via `Promise.all` and returns a combined object:

```json
{
  "totalSearches": 100,
  "topTowns": [...],
  "topFlatTypes": [...],
  "topFlatModels": [...],
  "priceRanges": [...]
}
```

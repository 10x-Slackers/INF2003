# Town Profile Collection Functions

Source: `lib/collections/town-profile/functions.ts`

Output examples use placeholder strings to show shape and type, not real data.

## `listTownProfiles()`

```js
db.towns.find({}).toArray();
```

Output:

```json
[
  {
    "_id": "<uuid>",
    "transactionSummary": {
      "totalTransaction": "<number>",
      "earliestTransaction": "<yyyy-mm>",
      "latestTransaction": "<yyyy-mm>",
      "transactionsLast6Months": "<number>",
      "transactionCountByFlatType": {
        "<flat_type_id>": "<number>"
      }
    },
    "coordinates": [
      [
        ["<longitude>", "<latitude>"],
        ["<longitude>", "<latitude>"],
        ["<longitude>", "<latitude>"],
        ["<longitude>", "<latitude>"]
      ]
    ],
    "updatedAt": "<timestamp_ms>"
  }
]
```

## `getTownProfileById(id)`

```js
db.towns.findOne({ _id: id });
```

Output:

```json
{
  "_id": "<uuid>",
  "transactionSummary": {
    "totalTransaction": "<number>",
    "earliestTransaction": "<yyyy-mm>",
    "latestTransaction": "<yyyy-mm>",
    "transactionsLast6Months": "<number>",
    "transactionCountByFlatType": {
      "<flat_type_id>": "<number>"
    }
  },
  "coordinates": [
    [
      ["<longitude>", "<latitude>"],
      ["<longitude>", "<latitude>"],
      ["<longitude>", "<latitude>"],
      ["<longitude>", "<latitude>"]
    ]
  ],
  "updatedAt": "<timestamp_ms>"
}
```

Returns `null` when no document matches.

## `rollDownTownProfileTransaction(townId, flatTypeId, transactionMonth)`

```js
db.towns.findOneAndUpdate({ _id: townId }, [
  {
    $set: {
      "transactionSummary.totalTransaction": {
        $add: ["$transactionSummary.totalTransaction", 1],
      },
      [`transactionSummary.transactionCountByFlatType.${flatTypeId}`]: {
        $add: [
          {
            $ifNull: [
              `$transactionSummary.transactionCountByFlatType.${flatTypeId}`,
              0,
            ],
          },
          1,
        ],
      },
      "transactionSummary.earliestTransaction": {
        $cond: [
          { $lt: [month, "$transactionSummary.earliestTransaction"] },
          month,
          "$transactionSummary.earliestTransaction",
        ],
      },
      "transactionSummary.latestTransaction": {
        $cond: [
          { $gt: [month, "$transactionSummary.latestTransaction"] },
          month,
          "$transactionSummary.latestTransaction",
        ],
      },
      updatedAt,
    },
  },
]);
```

## `bulkUpdateTownProfileTransactionsLast6Months(input)`

```js
db.towns.bulkWrite([
  {
    updateOne: {
      filter: { _id: townId },
      update: {
        $set: {
          "transactionSummary.transactionsLast6Months": transactionsLast6Months,
          updatedAt,
        },
      },
    },
  },
]);
```

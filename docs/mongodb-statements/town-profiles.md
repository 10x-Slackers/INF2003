# Town Profile Collection Functions

Source: `lib/collections/town-profile/functions.ts`

## `listTownProfiles()`

```js
db.towns.find({}).toArray();
```

Returned fields: `_id, transactionSummary, coordinates, updatedAt`

## `getTownProfileById(id)`

```js
db.towns.findOne({ _id: id });
```

Returned fields: `_id, transactionSummary, coordinates, updatedAt` or `null`

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

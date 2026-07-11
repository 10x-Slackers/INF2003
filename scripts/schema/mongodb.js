// Create alerts collection with schema validation
db.alerts.drop();
db.createCollection("alerts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "userId",
        "filters",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        _id: { bsonType: "string" },
        userId: { bsonType: "string" },
        filters: {
          bsonType: "object",
          properties: {
            townId: { bsonType: "array", items: { bsonType: "string" } },
            flatModelId: { bsonType: "array", items: { bsonType: "string" } },
            flatTypeId: { bsonType: "array", items: { bsonType: "string" } },
            price: {
              bsonType: "object",
              properties: {
                min: { bsonType: ["int", "long", "double", "decimal"] },
                max: { bsonType: ["int", "long", "double", "decimal"] },
              },
              additionalProperties: false,
            },
            floorAreaSqm: {
              bsonType: "object",
              properties: {
                min: { bsonType: ["int", "long", "double", "decimal"] },
                max: { bsonType: ["int", "long", "double", "decimal"] },
              },
              additionalProperties: false,
            },
            storey: {
              bsonType: "object",
              properties: {
                min: { bsonType: ["int", "long"] },
                max: { bsonType: ["int", "long"] },
              },
              additionalProperties: false,
            },
            leaseRemaining: {
              bsonType: "object",
              properties: {
                min: { bsonType: ["int", "long", "double", "decimal"] },
                max: { bsonType: ["int", "long", "double", "decimal"] },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        isActive: { bsonType: "bool" },
        createdAt: { bsonType: ["int"] },
        updatedAt: { bsonType: ["int"] },
        lastTriggeredAt: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});

// Create statistics collection
db.statistics.drop();
db.createCollection("statistics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "metric",
        "granularity",
        "timeRange",
        "dimensions",
        "series",
        "computedAt",
      ],
      properties: {
        _id: { bsonType: "string" },
        metric: {
          enum: [
            "AVG_PRICE_BY_FLAT_TYPE",
            "AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE",
            "AVG_PRICE_PER_SQM_BY_FLAT_TYPE",
            "AVG_PRICE_BY_TOWN_AND_FLAT_TYPE",
          ],
        },
        granularity: { enum: ["monthly", "yearly"] },
        timeRange: {
          bsonType: "object",
          required: ["start", "end"],
          properties: {
            start: { bsonType: "string" },
            end: { bsonType: "string" },
          },
          additionalProperties: false,
        },
        dimensions: {
          bsonType: "object",
          required: ["townId", "flatTypeId", "propertyId"],
          properties: {
            townId: { bsonType: ["null", "string"] },
            flatTypeId: { bsonType: ["null", "string"] },
            propertyId: { bsonType: ["null", "string"] },
          },
          additionalProperties: false,
        },
        series: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["period", "value", "sampleSize"],
            properties: {
              period: { bsonType: "string" },
              value: { bsonType: ["int", "long", "double", "decimal"] },
              sampleSize: { bsonType: ["int", "long"], minimum: 0 },
            },
            additionalProperties: false,
          },
        },
        computedAt: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});

// Create statistics trigger collection
db.statisticsTriggers.drop();
db.createCollection("statisticsTriggers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "dirtyTownIds", "updatedAt"],
      properties: {
        _id: { enum: ["statistics"] },
        dirtyTownIds: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        updatedAt: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});

// Create towns collection
db.towns.drop();
db.createCollection("towns", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "transactionSummary", "coordinates", "updatedAt"],
      properties: {
        _id: { bsonType: "string" },
        transactionSummary: {
          bsonType: "object",
          required: [
            "totalTransaction",
            "transactionsLast6Months",
            "transactionCountByFlatType",
          ],
          properties: {
            totalTransaction: { bsonType: ["int", "long"], minimum: 0 },
            transactionsLast6Months: { bsonType: ["int", "long"], minimum: 0 },
            transactionCountByFlatType: {
              bsonType: "object",
              additionalProperties: {
                bsonType: ["int", "long", "double", "decimal"],
              },
            },
          },
          additionalProperties: false,
        },
        coordinates: {
          bsonType: "array",
          items: {
            bsonType: "array",
            minItems: 4,
            items: {
              bsonType: "array",
              minItems: 2,
              items: { bsonType: ["int", "long", "double", "decimal"] },
            },
          },
        },
        updatedAt: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});

// Create searchHistory collection
db.searchHistory.drop();
db.createCollection("searchHistory", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "query", "searchedAt"],
      properties: {
        _id: { bsonType: "string" },
        userId: { bsonType: ["string", "null"] },
        query: {
          bsonType: "object",
          properties: {
            townId: { bsonType: "array", items: { bsonType: "string" } },
            flatTypeId: { bsonType: "array", items: { bsonType: "string" } },
            flatModelId: { bsonType: "array", items: { bsonType: "string" } },
            price: {
              bsonType: "object",
              properties: {
                min: { bsonType: ["int", "long", "double", "decimal"] },
                max: { bsonType: ["int", "long", "double", "decimal"] },
              },
              additionalProperties: false,
            },
            leaseCommenceYear: { bsonType: ["null", "int", "long"] },
          },
          additionalProperties: false,
        },
        searchedAt: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});

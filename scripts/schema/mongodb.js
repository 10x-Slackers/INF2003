db.alerts.drop();
db.createCollection("alerts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "user_id",
        "filters",
        "is_active",
        "created_at",
        "updated_at",
      ],
      properties: {
        _id: { bsonType: "string" },
        user_id: { bsonType: "string" },
        filters: {
          bsonType: "object",
          properties: {
            town_id: { bsonType: "array", items: { bsonType: "string" } },
            flat_model_id: { bsonType: "array", items: { bsonType: "string" } },
            flat_type_id: { bsonType: "array", items: { bsonType: "string" } },
            price: {
              bsonType: "object",
              properties: {
                min: { bsonType: ["int", "long", "double", "decimal"] },
                max: { bsonType: ["int", "long", "double", "decimal"] },
              },
              additionalProperties: false,
            },
            floor_area_sqm: {
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
            lease_remaining: {
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
        is_active: { bsonType: "bool" },
        created_at: { bsonType: ["int"] },
        updated_at: { bsonType: ["int"] },
        last_triggered_at: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});
db.alerts.createIndex(
  { user_id: 1, is_active: 1 },
  { name: "alerts_user_active_idx" },
);
db.alerts.createIndex(
  { is_active: 1, last_triggered_at: -1 },
  { name: "alerts_active_last_triggered_idx" },
);
db.alerts.createIndex({ "filters.town_id": 1 }, { name: "alerts_town_idx" });
db.alerts.createIndex(
  { "filters.flat_type_id": 1 },
  { name: "alerts_flat_type_idx" },
);
db.alerts.createIndex(
  { "filters.flat_model_id": 1 },
  { name: "alerts_flat_model_idx" },
);

db.statistics.drop();
db.createCollection("statistics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "metric",
        "granularity",
        "time_range",
        "dimensions",
        "series",
        "computed_at",
      ],
      properties: {
        _id: { bsonType: "string" },
        metric: { bsonType: "string" },
        granularity: { enum: ["monthly", "yearly"] },
        time_range: {
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
          required: ["town_id", "flat_type_id", "flat_model_id"],
          properties: {
            town_id: { bsonType: ["null", "string"] },
            flat_type_id: { bsonType: ["null", "string"] },
            flat_model_id: { bsonType: ["null", "string"] },
          },
          additionalProperties: false,
        },
        series: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["period", "value", "sample_size"],
            properties: {
              period: { bsonType: "string" },
              value: { bsonType: ["int", "long", "double", "decimal"] },
              sample_size: { bsonType: ["int", "long"], minimum: 0 },
            },
            additionalProperties: false,
          },
        },
        computed_at: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});
db.statistics.createIndex(
  {
    metric: 1,
    granularity: 1,
    "dimensions.town_id": 1,
    "dimensions.flat_type_id": 1,
    "dimensions.flat_model_id": 1,
  },
  { name: "statistics_lookup_idx" },
);
db.statistics.createIndex(
  { computed_at: -1 },
  { name: "statistics_computed_at_idx" },
);

db.reviews.drop();
db.createCollection("reviews", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "user_id",
        "property_id",
        "rating",
        "pros",
        "cons",
        "created_at",
        "updated_at",
      ],
      properties: {
        _id: { bsonType: "string" },
        user_id: { bsonType: "string" },
        property_id: { bsonType: "string" },
        rating: { bsonType: ["int", "long"], minimum: 1, maximum: 5 },
        pros: { bsonType: "array", items: { bsonType: "string" } },
        cons: { bsonType: "array", items: { bsonType: "string" } },
        remarks: { bsonType: "string" },
        created_at: { bsonType: ["int"] },
        updated_at: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});
db.reviews.createIndex(
  { user_id: 1, created_at: -1 },
  { name: "reviews_user_idx" },
);
db.reviews.createIndex(
  { property_id: 1, created_at: -1 },
  { name: "reviews_property_idx" },
);

db.towns.drop();
db.createCollection("towns", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "transaction_summary", "coordinates", "updated_at"],
      properties: {
        _id: { bsonType: "string" },
        transaction_summary: {
          bsonType: "object",
          required: [
            "total_transaction",
            "earliest_transaction",
            "latest_transaction",
            "avg_resale_price_by_flat_type",
          ],
          properties: {
            total_transaction: { bsonType: ["int", "long"], minimum: 0 },
            earliest_transaction: { bsonType: "string" },
            latest_transaction: { bsonType: "string" },
            avg_resale_price_by_flat_type: {
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
        updated_at: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});
db.towns.createIndex(
  { "transaction_summary.latest_transaction": -1 },
  { name: "towns_latest_transaction_idx" },
);
db.towns.createIndex({ updated_at: -1 }, { name: "towns_updated_at_idx" });

db.search_history.drop();
db.createCollection("search_history", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "user_id", "query", "searched_at"],
      properties: {
        _id: { bsonType: "string" },
        user_id: { bsonType: "string" },
        query: {
          bsonType: "object",
          properties: {
            town_id: { bsonType: "array", items: { bsonType: "string" } },
            flat_type_id: { bsonType: "array", items: { bsonType: "string" } },
            min_price: { bsonType: ["int", "long", "double", "decimal"] },
            max_price: { bsonType: ["int", "long", "double", "decimal"] },
            floor_area_min: { bsonType: ["int", "long", "double", "decimal"] },
            floor_area_max: { bsonType: ["int", "long", "double", "decimal"] },
            storey_min: { bsonType: ["null", "int", "long"] },
            storey_max: { bsonType: ["null", "int", "long"] },
            lease_remaining_min: {
              bsonType: ["null", "int", "long", "double", "decimal"],
            },
            lease_remaining_max: {
              bsonType: ["null", "int", "long", "double", "decimal"],
            },
            transaction_year_from: { bsonType: ["null", "int", "long"] },
            transaction_year_to: { bsonType: ["null", "int", "long"] },
          },
          additionalProperties: false,
        },
        searched_at: { bsonType: ["int"] },
      },
      additionalProperties: false,
    },
  },
});
db.search_history.createIndex(
  { user_id: 1, searched_at: -1 },
  { name: "search_history_user_time_idx" },
);
db.search_history.createIndex(
  { "query.town_id": 1 },
  { name: "search_history_town_idx" },
);
db.search_history.createIndex(
  { "query.flat_type_id": 1 },
  { name: "search_history_flat_type_idx" },
);

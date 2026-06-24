import { MongoClient, type Db } from "mongodb";
import { requireEnv } from "@/lib/utils";

const host = requireEnv("MONGO_HOST");
const port = process.env.MONGO_PORT || 27017;
const user = encodeURIComponent(requireEnv("MONGO_USER"));
const password = encodeURIComponent(requireEnv("MONGO_PASSWORD"));
const database = requireEnv("MONGO_DATABASE");

const uri = `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;

/** Singleton MongoDB client */
const globalForDb = globalThis as unknown as {
  __mongoClient?: MongoClient;
};

function createClient(): MongoClient {
  return new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
}

export const client: MongoClient = globalForDb.__mongoClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__mongoClient = client;
}

/** Default database handle */
export const db: Db = client.db(database);

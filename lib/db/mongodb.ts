import { MongoClient, type Collection, type Db } from "mongodb";
import { randomUUID } from "node:crypto";
import { handleDbError, requireEnv } from "@/lib/utils";

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

/** Find a document by its `_id`. */
export async function findById<T extends { _id: string }>(
  collection: Collection<T>,
  id: string,
): Promise<T | null> {
  try {
    return (await collection.findOne({ _id: id } as never)) as T | null;
  } catch (error) {
    return handleDbError(error);
  }
}

/** Delete a document by its `_id`, returning true if a document was deleted. */
export async function deleteDocById<T extends { _id: string }>(
  collection: Collection<T>,
  id: string,
): Promise<boolean> {
  try {
    const result = await collection.deleteOne({ _id: id } as never);
    return result.deletedCount > 0;
  } catch (error) {
    return handleDbError(error);
  }
}

/** Insert a document with a generated uuid `_id` and return it. */
export async function createWithUuid<T extends { _id: string }>(
  collection: Collection<T>,
  data: Omit<T, "_id">,
): Promise<T> {
  try {
    const document = { _id: randomUUID(), ...data } as T;
    await collection.insertOne(document as never);
    return document;
  } catch (error) {
    return handleDbError(error);
  }
}

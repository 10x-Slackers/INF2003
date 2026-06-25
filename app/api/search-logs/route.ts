import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { SearchLog } from "@/lib/db/mongodb-types";

const searchLogs = db.collection<SearchLog>("search_history");

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("user_id");
  const documents = await searchLogs
    .find(userId ? { user_id: userId } : {})
    .sort({ searched_at: -1 })
    .limit(50)
    .toArray();

  return Response.json(documents);
}

export async function POST(request: Request) {
  const body = await request.json();
  const searchLog: SearchLog = {
    _id: randomUUID(),
    user_id: body.user_id,
    query: body.query,
    searched_at: Math.floor(Date.now() / 1000),
  };

  await searchLogs.insertOne(searchLog);
  return Response.json(searchLog, { status: 201 });
}

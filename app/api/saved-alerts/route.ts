import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { SavedAlert } from "@/lib/db/mongodb-types";

const alerts = db.collection<SavedAlert>("alerts");

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("user_id");
  const documents = await alerts
    .find(userId ? { user_id: userId } : {})
    .sort({ created_at: -1 })
    .toArray();

  return Response.json(documents);
}

export async function POST(request: Request) {
  const body = await request.json();
  const now = Math.floor(Date.now() / 1000);
  const alert: SavedAlert = {
    _id: randomUUID(),
    user_id: body.user_id,
    filters: body.filters,
    is_active: body.is_active ?? true,
    created_at: now,
    updated_at: now,
  };

  await alerts.insertOne(alert);
  return Response.json(alert, { status: 201 });
}

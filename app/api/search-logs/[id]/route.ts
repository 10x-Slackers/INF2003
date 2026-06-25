import { db } from "@/lib/db";
import type { SearchLog } from "@/lib/db/mongodb-types";

const searchLogs = db.collection<SearchLog>("search_history");

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const searchLog = await searchLogs.findOne({ _id: id });

  if (!searchLog) {
    return Response.json({ error: "Search log not found" }, { status: 404 });
  }

  return Response.json(searchLog);
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json();
  const result = await searchLogs.updateOne(
    { _id: id },
    { $set: { query: body.query } },
  );

  if (!result.matchedCount) {
    return Response.json({ error: "Search log not found" }, { status: 404 });
  }

  return Response.json(await searchLogs.findOne({ _id: id }));
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const result = await searchLogs.deleteOne({ _id: id });

  if (!result.deletedCount) {
    return Response.json({ error: "Search log not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}

import { db } from "@/lib/db";
import type { SavedAlert } from "@/lib/db/mongodb-types";

const alerts = db.collection<SavedAlert>("alerts");

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const alert = await alerts.findOne({ _id: id });

  if (!alert) {
    return Response.json({ error: "Saved alert not found" }, { status: 404 });
  }

  return Response.json(alert);
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json();
  const update = {
    ...(body.filters !== undefined && { filters: body.filters }),
    ...(body.is_active !== undefined && { is_active: body.is_active }),
    updated_at: Math.floor(Date.now() / 1000),
  };
  const result = await alerts.updateOne({ _id: id }, { $set: update });

  if (!result.matchedCount) {
    return Response.json({ error: "Saved alert not found" }, { status: 404 });
  }

  return Response.json(await alerts.findOne({ _id: id }));
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const result = await alerts.deleteOne({ _id: id });

  if (!result.deletedCount) {
    return Response.json({ error: "Saved alert not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}

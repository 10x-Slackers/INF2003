import { NextRequest } from "next/server";
import { updateUserSchema } from "@/lib/validation/user";
import {
  badRequest,
  forbidden,
  handleApiError,
  notFound,
  ok,
} from "@/lib/api-response";
import { requireRole, requireUser } from "@/lib/auth/guards";
import { deleteUser, getUserById, updateUser } from "@/lib/users";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await requireUser();
    const { id } = await params;

    if (currentUser.id !== id && currentUser.role !== "ADMIN") {
      return forbidden();
    }

    const user = await getUserById(id);
    if (!user) return notFound(`User ${id} not found`);
    return ok(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await requireUser();
    const { id } = await params;

    if (currentUser.id !== id && currentUser.role !== "ADMIN") {
      return forbidden();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Malformed JSON body");
    }

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }

    if (parsed.data.role !== undefined && currentUser.role !== "ADMIN") {
      return forbidden("Only admins can change role");
    }

    const user = await updateUser(id, parsed.data);
    if (!user) return notFound(`User ${id} not found`);
    return ok(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const deleted = await deleteUser(id);
    if (!deleted) return notFound(`User ${id} not found`);
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}

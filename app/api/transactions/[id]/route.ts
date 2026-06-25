import { NextRequest } from "next/server";
import { updateTransactionSchema } from "@/lib/validation/transaction";
import {
  badRequest,
  forbidden,
  handleApiError,
  notFound,
  ok,
} from "@/lib/api-response";
import { requireRole, requireUser } from "@/lib/auth/guards";
import {
  deleteTransaction,
  getTransactionById,
  updateTransaction,
} from "@/lib/transactions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const transaction = await getTransactionById(id);
    if (!transaction) return notFound(`Transaction ${id} not found`);
    return ok(transaction);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await requireUser();
    const { id } = await params;

    const existing = await getTransactionById(id);
    if (!existing) return notFound(`Transaction ${id} not found`);

    if (
      currentUser.id !== existing.uploaded_by_user_id &&
      currentUser.role !== "ADMIN"
    ) {
      return forbidden();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Malformed JSON body");
    }

    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }

    const transaction = await updateTransaction(id, parsed.data);
    if (!transaction) return notFound(`Transaction ${id} not found`);
    return ok(transaction);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const deleted = await deleteTransaction(id);
    if (!deleted) return notFound(`Transaction ${id} not found`);
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}

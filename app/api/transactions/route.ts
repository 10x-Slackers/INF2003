import { NextRequest } from "next/server";
import {
  createTransactionSchema,
  transactionListQuerySchema,
} from "@/lib/validation/transaction";
import { badRequest, created, handleApiError, okPaginated } from "@/lib/api-response";
import { requireUser } from "@/lib/auth/guards";
import { createTransaction, listTransactions } from "@/lib/transactions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = transactionListQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const { page, pageSize, ...filters } = parsed.data;
    const { data, total } = await listTransactions({ ...filters, page, pageSize });
    return okPaginated(data, total, page, pageSize);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Malformed JSON body");
    }

    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid transaction payload", parsed.error.flatten());
    }

    const transaction = await createTransaction(parsed.data, user.id);
    return created(transaction);
  } catch (err) {
    return handleApiError(err);
  }
}

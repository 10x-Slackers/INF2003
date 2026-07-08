import type { CreateTransaction } from "@/lib/tables/transactions";

export type AddTransactionInput = {
  uploadedByUserId: string;
  input: CreateTransaction;
};

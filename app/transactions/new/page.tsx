import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAgent } from "@/lib/permissions";
import {
  listFlatModels,
  listFlatTypes,
  listStoreyRanges,
} from "@/lib/tables/lookups";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { ROUTES } from "@/lib/routes";

export default async function NewTransactionPage() {
  const session = await auth();
  if (!isAgent(session?.user?.role)) {
    redirect(ROUTES.LOGIN);
  }

  const [flatTypes, flatModels, storeyRanges] = await Promise.all([
    listFlatTypes(),
    listFlatModels(),
    listStoreyRanges(),
  ]);

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">New transaction</h1>
      <div className="mx-auto w-full max-w-xl">
        <TransactionForm
          flatTypes={flatTypes}
          flatModels={flatModels}
          storeyRanges={storeyRanges}
        />
      </div>
    </main>
  );
}

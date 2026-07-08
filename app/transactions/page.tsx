import { TransactionsPanel } from "@/components/transactions/transactions-panel";

export default function TransactionsPage() {
  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <TransactionsPanel />
    </main>
  );
}

import { CreateTransactionFlow } from "@/components/agent/create-transaction-flow";
import { EmptyState } from "@/components/display/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/guards";
import { transactionCreatorRoles } from "@/lib/auth/permissions";

export default async function NewTransactionPage() {
  const session = await requireRole(
    transactionCreatorRoles,
    "/agent/transactions/new",
  );

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          title="Not authorized"
          description="Creating transactions requires the AGENT or ADMIN role."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="New transaction"
        description="Search for an existing property, select it, and enter resale transaction details."
      />
      <CreateTransactionFlow />
    </AppShell>
  );
}

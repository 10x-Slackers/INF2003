import { CreateTransactionFlow } from "@/components/agent/create-transaction-flow";
import { EmptyState } from "@/components/display/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/guards";

export default async function NewTransactionPage() {
  const session = await requireRole(["AGENT"], "/agent/transactions/new");

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          title="Not authorized"
          description="Creating transactions requires the AGENT role."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="New transaction"
        description="Search for an existing property, select it, and enter resale transaction details."
        action={<Badge variant="outline">AGENT</Badge>}
      />
      <CreateTransactionFlow />
    </AppShell>
  );
}

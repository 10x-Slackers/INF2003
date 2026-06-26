import Link from "next/link";
import { EmptyState } from "@/components/display/empty-state";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionManagementTable } from "@/components/transactions/transaction-management-table";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { transactionCreatorRoles } from "@/lib/auth/permissions";

export default async function TransactionsPage() {
  const session = await requireRole(transactionCreatorRoles, "/transactions");

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          title="Not authorized"
          description="Transaction management requires the AGENT or ADMIN role."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Transactions"
        description="Manage placeholder resale transaction rows."
        action={
          <Button asChild>
            <Link href="/agent/transactions/new">Add transaction</Link>
          </Button>
        }
      />
      <PlaceholderPanel
        title="Transaction management"
        description="Search and filter placeholder transactions before editing or deleting them."
      >
        <TransactionManagementTable />
      </PlaceholderPanel>
    </AppShell>
  );
}

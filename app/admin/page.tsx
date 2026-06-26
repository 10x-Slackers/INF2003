import { AdminTableSwitcher } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/display/empty-state";
import { MetricCard } from "@/components/display/metric-card";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/guards";
import { adminRoles } from "@/lib/auth/permissions";
import { placeholderUsers } from "@/lib/frontend/placeholders";

export default async function AdminPage() {
  const session = await requireRole(adminRoles, "/admin");

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          title="Not authorized"
          description="Admin tools require the ADMIN role."
        />
      </AppShell>
    );
  }

  const agentCount = placeholderUsers.filter(
    (user) => user.role === "AGENT",
  ).length;
  const adminCount = placeholderUsers.filter(
    (user) => user.role === "ADMIN",
  ).length;

  return (
    <AppShell>
      <PageHeader
        title="Admin"
        description="Placeholder management area for user roles and property records."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Users" value={String(placeholderUsers.length)} />
        <MetricCard label="Agents" value={String(agentCount)} />
        <MetricCard label="Admins" value={String(adminCount)} />
      </div>
      <div className="grid gap-6">
        <PlaceholderPanel
          title="Table management"
          description="Switch between placeholder admin tables. User rows filter as you search."
        >
          <AdminTableSwitcher />
        </PlaceholderPanel>
      </div>
    </AppShell>
  );
}

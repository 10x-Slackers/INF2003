import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { EmptyState } from "@/components/display/empty-state";
import { MetricCard } from "@/components/display/metric-card";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/guards";

const adminRows = [
  { id: "users", area: "Users", status: "Planned CRUD", owner: "Admin" },
  { id: "towns", area: "Towns", status: "Planned CRUD", owner: "Admin" },
  {
    id: "amenities",
    area: "Amenities",
    status: "Planned CRUD",
    owner: "Admin",
  },
];

export default async function AdminPage() {
  const session = await requireRole(["ADMIN"], "/admin");

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

  return (
    <AppShell>
      <PageHeader
        title="Admin"
        description="Placeholder management area for users, towns, amenities, and reference data."
        action={<Badge variant="outline">ADMIN</Badge>}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Users" value="128" helper="Placeholder" />
        <MetricCard label="Towns" value="26" helper="Placeholder" />
        <MetricCard label="Amenities" value="1,240" helper="Placeholder" />
      </div>
      <PlaceholderPanel title="Management modules">
        <DataTablePlaceholder
          columns={[
            { key: "area", header: "Area" },
            { key: "status", header: "Status" },
            { key: "owner", header: "Owner" },
          ]}
          rows={adminRows}
        />
      </PlaceholderPanel>
    </AppShell>
  );
}

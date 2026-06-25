import { PropertyAlertManager } from "@/components/alerts/property-alert-manager";
import { EmptyState } from "@/components/display/empty-state";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/guards";
import { properties } from "@/lib/frontend/placeholders";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;
  const session = await requireRole(["USER", "AGENT", "ADMIN"], "/alerts");

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          title="Not authorized"
          description="Alerts are available to signed-in users."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Alerts"
        description="Create property-based alerts with metric criteria so new matching transactions can be reviewed quickly."
      />
      <PlaceholderPanel
        title="Property alerts"
        description="Choose a property, pick a metric, then set a numeric range or select a categorical value."
      >
        <PropertyAlertManager
          initialPropertyId={propertyId}
          properties={properties}
        />
      </PlaceholderPanel>
    </AppShell>
  );
}

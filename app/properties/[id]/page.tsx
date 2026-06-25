import { EmptyState } from "@/components/display/empty-state";
import { MetricCard } from "@/components/display/metric-card";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PropertyActions } from "@/components/properties/property-actions";
import { PropertyTransactionsTable } from "@/components/properties/property-transactions-table";
import { Badge } from "@/components/ui/badge";
import { properties, transactions } from "@/lib/frontend/placeholders";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = properties.find((item) => item.id === id);
  const recentTransactions = transactions.filter(
    (transaction) => transaction.propertyId === id,
  );

  if (!property) {
    return (
      <AppShell>
        <EmptyState
          title="Property not found"
          description="This placeholder record does not exist."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={`${property.block} ${property.streetName}`}
        description={`${property.town} · Lease commenced in ${property.leaseCommenceYear}`}
        action={<PropertyActions property={property} />}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Average resale price"
          value="$648,000"
          helper="Placeholder"
        />
        <MetricCard
          label="Recent transactions"
          value={String(recentTransactions.length)}
          helper="Placeholder"
        />
        <MetricCard label="Nearby amenities" value="18" helper="Placeholder" />
      </div>

      <div className="grid gap-6">
        <PlaceholderPanel
          title="Recent transactions"
          description="Placeholder resale rows for this property. These fields mirror the resale transaction schema."
        >
          <PropertyTransactionsTable propertyId={property.id} />
        </PlaceholderPanel>

        <PlaceholderPanel
          title="Property details"
          description="This page will later combine MariaDB property records with MongoDB town profile data."
        >
          <div className="mb-4">
            <Badge variant="outline">Property placeholder</Badge>
          </div>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Town</dt>
              <dd>{property.town}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Block</dt>
              <dd>{property.block}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Street</dt>
              <dd>{property.streetName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lease commence year</dt>
              <dd>{property.leaseCommenceYear}</dd>
            </div>
          </dl>
        </PlaceholderPanel>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { MetricCard } from "@/components/display/metric-card";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { transactions } from "@/lib/frontend/placeholders";

export default function Home() {
  return (
    <AppShell>
      <PageHeader
        title="Market overview"
        description="Placeholder frontend for HDB resale search, analytics, bookmarks, alerts, and role-based transaction management."
        action={
          <Button asChild>
            <Link href="/properties">Browse properties</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Tracked transactions"
          value="150k+"
          helper="Demo metric"
        />
        <MetricCard
          label="Towns covered"
          value="26"
          helper="From HDB datasets"
        />
        <MetricCard
          label="Latest month"
          value="May 2026"
          helper="Placeholder data"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <PlaceholderPanel
          title="Recent resale transactions"
          description="Static rows for now; API-backed search will replace this table later."
        >
          <DataTablePlaceholder
            columns={[
              { key: "town", header: "Town" },
              { key: "flatType", header: "Flat type" },
              { key: "month", header: "Month" },
              { key: "price", header: "Price" },
            ]}
            rows={transactions}
          />
        </PlaceholderPanel>

        <PlaceholderPanel
          title="Feature status"
          description="Frontend shells are ready for later database wiring."
        >
          <div className="flex flex-wrap gap-2">
            {[
              "Search",
              "Analytics",
              "Bookmarks",
              "Property alerts",
              "Agent CRUD",
            ].map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </PlaceholderPanel>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { FilterBar } from "@/components/data/filter-bar";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import { FormFieldText } from "@/components/forms/form-fields";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { properties } from "@/lib/frontend/placeholders";

export default async function PropertiesPage() {
  const session = await auth();
  const isAgent = session?.user.role === "AGENT";

  return (
    <AppShell>
      <PageHeader
        title="Properties"
        description="Browse HDB properties, open a property to see its details, and review its recent resale transactions."
        action={
          isAgent && (
            <Button asChild>
              <Link href="/agent/transactions/new">Add transaction</Link>
            </Button>
          )
        }
      />

      <FilterBar>
        <FormFieldText label="Town" name="town" placeholder="Queenstown" />
        <FormFieldText label="Block" name="block" placeholder="12" />
        <FormFieldText
          label="Street name"
          name="streetName"
          placeholder="Dover Close East"
        />
        <FormFieldText
          label="Lease year"
          name="leaseCommenceYear"
          type="number"
        />
      </FilterBar>

      <PlaceholderPanel
        title="Matching properties"
        description="Placeholder property rows; clicking a property opens details and recent transactions."
      >
        <DataTablePlaceholder
          columns={[
            { key: "town", header: "Town" },
            { key: "block", header: "Block" },
            { key: "streetName", header: "Street" },
            { key: "leaseCommenceYear", header: "Lease year" },
            {
              key: "open",
              header: "Open",
              render: (property) => (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/properties/${property.id}`}>View details</Link>
                </Button>
              ),
            },
          ]}
          rows={properties}
        />
      </PlaceholderPanel>
    </AppShell>
  );
}

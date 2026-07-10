import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PropertyDetail } from "@/lib/tables/properties";

export function PropertySummaryCard({
  property,
}: {
  property: PropertyDetail;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Block {property.block}, {property.street_name}
        </CardTitle>
        <CardDescription>
          {property.town?.name && `${property.town.name} · `}
          Lease commence {property.lease_commence_year}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

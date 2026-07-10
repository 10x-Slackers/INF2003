import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PropertyDetail } from "@/lib/tables/properties";

export function PropertySummaryCard({
  property,
  flatTypes,
  flatModels,
}: {
  property: PropertyDetail;
  flatTypes: string[];
  flatModels: string[];
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
        {flatTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {flatTypes.map((type) => (
              <Badge key={type} variant="secondary">
                {type}
              </Badge>
            ))}
            {flatModels.map((model) => (
              <Badge key={model} variant="outline">
                {model}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

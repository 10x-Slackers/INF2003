import Link from "next/link";
import { BookmarkX } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import type { SavedPropertyDetail } from "@/lib/tables/saved-properties";

export function SavedPropertyCard({
  bookmark,
  onRemove,
  pending,
}: {
  bookmark: SavedPropertyDetail;
  onRemove: (propertyId: string) => void;
  pending: boolean;
}) {
  if (!bookmark.property) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property unavailable</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const { property } = bookmark;
  const tx = property.latest_transaction;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link
            href={ROUTES.PROPERTY_DETAIL(property.id)}
            className="hover:underline"
          >
            Block {property.block}, {property.street_name}
          </Link>
        </CardTitle>
        <CardDescription>
          {property.town_name} · Lease {property.lease_commence_year}
        </CardDescription>
      </CardHeader>
      {tx && (
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Latest transaction
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{tx.flat_type}</Badge>
            <Badge variant="outline">{tx.flat_model}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Price</dt>
              <dd className="font-medium">
                S${Math.round(tx.resale_price).toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Area</dt>
              <dd>{Math.round(tx.floor_area_sqm)} sqm</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Storey</dt>
              <dd>
                {tx.min_storey}-{tx.max_storey}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Month</dt>
              <dd>
                {new Date(tx.transaction_month).toLocaleDateString("en-SG", {
                  month: "short",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      )}
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => onRemove(property.id)}
        >
          <BookmarkX />
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
}

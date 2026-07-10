import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/lib/routes";
import type { PropertyWithLatestTransaction } from "@/lib/tables/properties";

type PropertiesTableProps = {
  properties: PropertyWithLatestTransaction[];
  loading: boolean;
};

export function PropertiesTable({ properties, loading }: PropertiesTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Town</TableHead>
            <TableHead>Block / Street</TableHead>
            <TableHead>Lease commence year</TableHead>
            <TableHead>Latest flat type</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows />
          ) : properties.length === 0 ? (
            <EmptyRow />
          ) : (
            properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>{property.town_name}</TableCell>
                <TableCell>
                  <Link
                    className="underline-offset-4 hover:underline"
                    href={ROUTES.PROPERTY_DETAIL(property.id)}
                  >
                    {property.block} {property.street_name}
                  </Link>
                </TableCell>
                <TableCell>{property.lease_commence_year}</TableCell>
                <TableCell>
                  {property.latest_transaction?.flat_type ?? "-"}
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={ROUTES.PROPERTY_DETAIL(property.id)}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 5 }).map((_, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function EmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
        No properties found.
      </TableCell>
    </TableRow>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  listSavedAlertsAction,
  deleteSavedAlertAction,
} from "@/app/alerts/actions";
import type {
  SavedAlert,
  SavedAlertFilters,
} from "@/lib/collections/saved-alerts";
import type { Town } from "@/lib/tables/towns";
import type { FlatType, FlatModel } from "@/lib/tables/lookups";
import { ROUTES } from "@/lib/routes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function formatRange(
  label: string,
  range: { min?: number; max?: number } | undefined,
  suffix = "",
  prefix = "",
): string | null {
  if (!range) return null;
  const { min, max } = range;
  if (min !== undefined && max !== undefined)
    return `${label} ${prefix}${min} - ${prefix}${max}${suffix}`;
  if (min !== undefined) return `${label} ${prefix}${min}+${suffix}`;
  if (max !== undefined) return `${label} Up to ${prefix}${max}${suffix}`;
  return null;
}

function FilterSummary({
  filters,
  townMap,
  flatTypeMap,
  flatModelMap,
}: {
  filters: SavedAlertFilters;
  townMap: Map<string, string>;
  flatTypeMap: Map<string, string>;
  flatModelMap: Map<string, string>;
}) {
  const parts: string[] = [];

  const towns = filters.townId
    ?.map((id) => townMap.get(id))
    .filter(Boolean)
    .join(", ");
  if (towns) parts.push(towns);

  const types = filters.flatTypeId
    ?.map((id) => flatTypeMap.get(id))
    .filter(Boolean)
    .join(", ");
  if (types) parts.push(types);

  const models = filters.flatModelId
    ?.map((id) => flatModelMap.get(id))
    .filter(Boolean)
    .join(", ");
  if (models) parts.push(models);

  const price = formatRange("Price", filters.price, "", "$");
  if (price) parts.push(price);

  const area = formatRange("Area", filters.floorAreaSqm, " sqm");
  if (area) parts.push(area);

  const storey = formatRange("Storey", filters.storey);
  if (storey) parts.push(storey);

  const lease = formatRange("Lease", filters.leaseRemaining, " yrs");
  if (lease) parts.push(lease);

  return (
    <span className="text-sm text-muted-foreground">
      {parts.length > 0 ? parts.join(" · ") : "Any"}
    </span>
  );
}

export function SavedAlertsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [flatTypes, setFlatTypes] = useState<FlatType[]>([]);
  const [flatModels, setFlatModels] = useState<FlatModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cancelled = { current: false };
    (async () => {
      setLoading(true);
      try {
        const data = await listSavedAlertsAction();
        if (cancelled.current) return;
        setAlerts(data.alerts);
        setTowns(data.towns);
        setFlatTypes(data.flatTypes);
        setFlatModels(data.flatModels);
      } catch {
        if (cancelled.current) return;
        toast.error("Failed to load saved alerts");
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, [open]);

  const townMap = new Map(towns.map((t) => [t.id, t.name]));
  const flatTypeMap = new Map(flatTypes.map((f) => [String(f.id), f.name]));
  const flatModelMap = new Map(flatModels.map((f) => [String(f.id), f.name]));

  async function handleDelete(id: string) {
    try {
      const result = await deleteSavedAlertAction(id);
      if (result.ok) {
        setAlerts((prev) => prev.filter((a) => a._id !== id));
        toast.success("Alert deleted");
      } else {
        toast.error("Could not delete alert");
      }
    } catch {
      toast.error("Failed to delete alert");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Saved alerts</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <span className="text-sm text-muted-foreground">
              No saved alerts.
            </span>
            <Button variant="link" asChild>
              <Link href={ROUTES.ALERT_NEW}>Create one</Link>
            </Button>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2">
            {alerts.map((alert) => (
              <Card key={alert._id} size="sm">
                <CardContent className="flex flex-wrap items-center gap-2">
                  <FilterSummary
                    filters={alert.filters}
                    townMap={townMap}
                    flatTypeMap={flatTypeMap}
                    flatModelMap={flatModelMap}
                  />
                  <Badge
                    variant={alert.isActive ? "secondary" : "outline"}
                    className="shrink-0"
                  >
                    {alert.isActive ? "Active" : "Paused"}
                  </Badge>
                  <span className="text-xs text-muted-foreground sm:ml-auto">
                    {new Date(alert.createdAt * 1000).toLocaleDateString()}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-auto shrink-0 sm:ml-0"
                    onClick={() => handleDelete(alert._id)}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

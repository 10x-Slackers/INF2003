"use client";

import { Map, MapPolygon, MapPopup, MapTileLayer } from "@/components/ui/map";
import { Skeleton } from "@/components/ui/skeleton";

export type MapTown = {
  name: string;
  coordinates: number[][][];
  summary: {
    totalTransaction: number;
    transactionsLast6Months: number;
  };
};

// MongoDB stores coordinates as [lng, lat]; Leaflet expects [lat, lng].
function toLeafletPositions(rings: number[][][]) {
  return rings.map((ring) =>
    ring.map(([lng, lat]) => [lat, lng] as [number, number]),
  );
}

const HEAT_CLASSES = [
  "fill-red-100 stroke-red-100",
  "fill-red-300 stroke-red-300",
  "fill-red-500 stroke-red-500",
  "fill-red-700 stroke-red-700",
  "fill-red-900 stroke-red-900",
] as const;

function heatClass(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const index = Math.min(
    HEAT_CLASSES.length - 1,
    Math.floor(clamped * HEAT_CLASSES.length),
  );
  return HEAT_CLASSES[index];
}

export function TownMap({ towns }: { towns: MapTown[] }) {
  const maxTransactions = Math.max(
    1,
    ...towns.map((t) => t.summary.transactionsLast6Months),
  );

  return (
    <Map center={[1.3521, 103.8198]} zoom={11} className="h-[440px]">
      <MapTileLayer />
      {towns.map((town) => (
        <MapPolygon
          key={town.name}
          positions={toLeafletPositions(town.coordinates)}
          className={`${heatClass(town.summary.transactionsLast6Months / maxTransactions)} stroke-1`}
          pathOptions={{ fillOpacity: 0.4 }}
        >
          <MapPopup>
            <div className="space-y-1">
              <div className="text-sm font-semibold">{town.name}</div>
              <div className="text-muted-foreground text-xs">
                {town.summary.totalTransaction.toLocaleString()} transactions
              </div>
              <div className="text-muted-foreground text-xs">
                {town.summary.transactionsLast6Months.toLocaleString()} in last
                6 months
              </div>
            </div>
          </MapPopup>
        </MapPolygon>
      ))}
    </Map>
  );
}

export function TownMapSkeleton() {
  return <Skeleton className="h-[440px] w-full rounded-md" />;
}

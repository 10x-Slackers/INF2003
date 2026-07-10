import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PropertyStatisticsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="col-span-3 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="col-span-3 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value?: string;
  caption?: string | null;
  valueClassName?: string;
};

export function MetricCard({
  label,
  value,
  caption,
  valueClassName,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div>
          <p className={cn("text-3xl font-bold", valueClassName)}>{value}</p>
          {caption && <p className="text-muted-foreground">{caption}</p>}
        </div>
      </CardHeader>
    </Card>
  );
}

export function MetricCardSkeleton({ label }: { label?: string }) {
  return (
    <Card>
      <CardHeader className="gap-4">
        {label ? (
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        ) : (
          <Skeleton className="h-5 w-24" />
        )}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-32" />
          {!label && <Skeleton className="h-5 w-20" />}
        </div>
      </CardHeader>
    </Card>
  );
}

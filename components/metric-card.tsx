import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value?: string | null;
  caption?: string | null;
  isLoading?: boolean;
  valueClassName?: string;
};

export function MetricCard({
  label,
  value,
  caption,
  isLoading,
  valueClassName,
}: MetricCardProps) {
  if (isLoading || !value || !caption) {
    return (
      <Card aria-busy="true">
        <CardHeader className="gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div>
          <p className={cn("text-3xl font-bold", valueClassName)}>{value}</p>
          <p className="text-muted-foreground">{caption}</p>
        </div>
      </CardHeader>
    </Card>
  );
}

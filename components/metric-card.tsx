import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
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
  return (
    <Card>
      <CardHeader className="gap-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div>
          {
            isLoading ? (
              <>
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-20" />
              </>
            ) : (
              <>
                <p className={cn("text-3xl font-bold", valueClassName)}>{value}</p>
                {caption && <p className="text-muted-foreground">{caption}</p>}
              </>
            )
          }
        </div>
      </CardHeader>
    </Card>
  );
}

import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  caption: string;
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
          <p className="text-muted-foreground">{caption}</p>
        </div>
      </CardHeader>
    </Card>
  );
}

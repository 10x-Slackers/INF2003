import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <Card className="mb-6">
      <CardContent>
        <div className="grid gap-3 md:grid-cols-4">{children}</div>
      </CardContent>
    </Card>
  );
}

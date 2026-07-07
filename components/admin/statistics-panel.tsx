"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { forceGenerateStatisticsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StatisticsPanel() {
  const [pending, setPending] = useState(false);

  async function handleGenerate() {
    setPending(true);
    try {
      const result = await forceGenerateStatisticsAction();
      toast.success(
        `Generated ${result.statistics} statistics across ${result.towns} towns`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate statistics",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>
          Force regenerate all statistics except property-level statistics.
        </CardDescription>
        <CardAction>
          <Button onClick={handleGenerate} disabled={pending}>
            <RefreshCw className={pending ? "animate-spin" : undefined} />
            {pending ? "Generating..." : "Generate statistics"}
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

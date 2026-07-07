"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  forceGeneratePropertyStatisticsAction,
  forceGenerateStatisticsAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PendingAction = "general" | "properties" | null;

export function StatisticsPanel() {
  const [pending, setPending] = useState<PendingAction>(null);

  async function handleGenerate() {
    setPending("general");
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
      setPending(null);
    }
  }

  async function handleGenerateProperties() {
    setPending("properties");
    try {
      const result = await forceGeneratePropertyStatisticsAction();
      toast.success(
        `Generated ${result.statistics} statistics across ${result.properties} properties`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to generate property statistics",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>
          Force regenerate statistics for dashboards and properties.
        </CardDescription>
        <CardAction>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={pending !== null}
            >
              <RefreshCw
                className={pending === "general" ? "animate-spin" : undefined}
              />
              {pending === "general" ? "Generating..." : "Generate statistics"}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleGenerateProperties}
              disabled={pending !== null}
            >
              <RefreshCw
                className={
                  pending === "properties" ? "animate-spin" : undefined
                }
              />
              {pending === "properties"
                ? "Generating..."
                : "Generate property statistics"}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

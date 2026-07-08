"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  generatePropertyStatsAction,
  generateStatsAction,
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

  async function handleAction(
    type: PendingAction,
    action: () => Promise<{ statistics: number; [key: string]: number }>,
    successMsg: string,
    errorMsg: string,
  ) {
    setPending(type);
    try {
      const { statistics } = await action();
      toast.success(`${successMsg} (${statistics} statistics generated)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : errorMsg);
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
              onClick={() =>
                handleAction(
                  "general",
                  generateStatsAction,
                  "Statistics generated successfully.",
                  "Failed to generate statistics.",
                )
              }
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
              onClick={() =>
                handleAction(
                  "properties",
                  generatePropertyStatsAction,
                  "Property statistics generated successfully.",
                  "Failed to generate property statistics.",
                )
              }
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

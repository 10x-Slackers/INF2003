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
    action: () => Promise<{ statistics: number;[key: string]: number }>,
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
  const actions = [
    {
      type: "general" as const,
      action: generateStatsAction,
      label: "Generate statistics",
      loadingLabel: "Generating...",
      successMsg: "Statistics generated successfully.",
      errorMsg: "Failed to generate statistics.",
    },
    {
      type: "properties" as const,
      action: generatePropertyStatsAction,
      label: "Generate property statistics",
      loadingLabel: "Generating...",
      successMsg: "Property statistics generated successfully.",
      errorMsg: "Failed to generate property statistics.",
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>
          Force regenerate statistics for dashboards and properties.
        </CardDescription>
        <CardAction>
          <div className="flex flex-col gap-2">
            {actions.map(({ type, action, label, loadingLabel, successMsg, errorMsg, variant }) => (
              <Button
                key={type}
                className="w-full"
                variant={variant}
                onClick={() => handleAction(type, action, successMsg, errorMsg)}
                disabled={pending !== null}
              >
                <RefreshCw className={pending === type ? "animate-spin" : undefined} />
                {pending === type ? loadingLabel : label}
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

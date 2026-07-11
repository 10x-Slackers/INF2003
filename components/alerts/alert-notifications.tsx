"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  listNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
} from "@/app/alerts/actions";
import type { AlertNotificationWithDetails } from "@/lib/tables/alert-notifications";
import { ROUTES } from "@/lib/routes";
import { SavedAlertsDialog } from "./saved-alerts-dialog";

const PAGE_SIZE = 20;

export function AlertNotifications({
  initialNotifications,
  initialTotal,
}: {
  initialNotifications: AlertNotificationWithDetails[];
  initialTotal: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function loadPage(currentPage: number) {
    setLoading(true);
    try {
      const { data, total } = await listNotificationsAction({
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      setNotifications(data);
      setTotal(total);
      setPage(currentPage);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      const result = await markNotificationReadAction(id);
      if (result.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
          ),
        );
      } else {
        toast.error("Could not mark as read");
      }
    } catch {
      toast.error("Could not mark as read");
    }
  }

  async function handleDelete(id: string) {
    try {
      const result = await deleteNotificationAction(id);
      if (result.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => prev - 1);
        toast.success("Notification deleted");
      } else {
        toast.error("Could not delete");
      }
    } catch {
      toast.error("Could not delete");
    }
  }

  async function handleMarkAllRead() {
    try {
      const result = await markAllNotificationsReadAction();
      if (result.ok) {
        const now = new Date().toISOString();
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at ?? now })),
        );
        toast.success("All notifications marked as read");
      } else {
        toast.error("Could not mark all as read");
      }
    } catch {
      toast.error("Could not mark all as read");
    }
  }

  const hasUnread = notifications.some((n) => n.read_at === null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Notifications</h2>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <Check />
              Mark all as read
            </Button>
          )}
          <Button variant="link" onClick={() => setDialogOpen(true)}>
            View saved alerts
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <Card key={n.id} size="sm">
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {n.read_at === null && (
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <span className="text-sm font-medium">
                    New matching transaction in {n.town_name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {n.flat_type_name} · {n.flat_model_name} · {n.block}{" "}
                  {n.street_name} · {n.min_storey}-{n.max_storey} storey ·{" "}
                  {n.floor_area_sqm} sqm
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      ${n.resale_price.toLocaleString()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {n.read_at === null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        <Check />
                        Mark as read
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={ROUTES.TRANSACTIONS}>
                        <ExternalLink />
                        View transaction
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(n.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalLabel={`${total} notifications`}
        loading={loading}
        onPrev={() => loadPage(Math.max(1, page - 1))}
        onNext={() => loadPage(Math.min(totalPages, page + 1))}
      />

      <SavedAlertsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSignedIn } from "@/lib/permissions";
import {
  listAlertNotificationsWithDetails,
  getUnreadCount,
} from "@/lib/tables/alert-notifications";
import { AlertNotifications } from "@/components/alerts/alert-notifications";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 20;

export default async function AlertsPage() {
  const session = await auth();
  if (!session || !isSignedIn(session.user.role)) {
    redirect(ROUTES.LOGIN);
  }

  const [{ data: notifications, total }, unreadCount] = await Promise.all([
    listAlertNotificationsWithDetails({
      userId: session.user.id,
      page: 1,
      pageSize: PAGE_SIZE,
    }),
    getUnreadCount(session.user.id),
  ]);

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">Alerts</h1>
      <p className="text-sm text-muted-foreground">
        {unreadCount > 0
          ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
          : "You're all caught up."}
      </p>
      <AlertNotifications
        initialNotifications={notifications}
        initialTotal={total}
      />
    </main>
  );
}

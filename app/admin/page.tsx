import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { StatisticsPanel } from "@/components/admin/statistics-panel";
import { UsersPanel } from "@/components/admin/users-panel";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    redirect("/login");
  }

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">Admin</h1>
      <StatisticsPanel />
      <h2 className="text-xl font-medium tracking-tight">Users</h2>
      <UsersPanel />
    </main>
  );
}

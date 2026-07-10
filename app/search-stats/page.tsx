import { auth } from "@/lib/auth";
import { isAgent } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { SearchStatsView } from "@/components/search-stats/search-stats-view";

export default async function SearchStatsPage() {
  const session = await auth();
  if (!isAgent(session?.user?.role)) {
    redirect(ROUTES.LOGIN);
  }
  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">Search statistics</h1>
      <SearchStatsView />
    </main>
  );
}

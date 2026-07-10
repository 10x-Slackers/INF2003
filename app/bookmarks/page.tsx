import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSignedIn } from "@/lib/permissions";
import { listSavedProperties } from "@/lib/tables/saved-properties";
import { BookmarksList } from "@/components/bookmarks/bookmarks-list";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 12;

export default async function BookmarksPage() {
  const session = await auth();
  if (!session || !isSignedIn(session.user.role)) {
    redirect(ROUTES.LOGIN);
  }

  const { data, total } = await listSavedProperties({
    userId: session.user.id,
    page: 1,
    pageSize: PAGE_SIZE,
  });

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">Bookmarks</h1>
      <p className="text-sm text-muted-foreground">
        {`${total} saved propert${total === 1 ? "y" : "ies"}`}
      </p>
      <BookmarksList
        initialBookmarks={data}
        initialTotal={total}
        pageSize={PAGE_SIZE}
      />
    </main>
  );
}

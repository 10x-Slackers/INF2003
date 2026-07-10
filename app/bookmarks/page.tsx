import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSignedIn } from "@/lib/permissions";
import { listSavedProperties } from "@/lib/tables/saved-properties";
import { BookmarksList } from "@/components/bookmarks/bookmarks-list";
import { ROUTES } from "@/lib/routes";

export default async function BookmarksPage() {
  const session = await auth();
  if (!session || !isSignedIn(session.user.role)) {
    redirect(ROUTES.LOGIN);
  }

  const bookmarks = await listSavedProperties(session.user.id);

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">Bookmarks</h1>
      <p className="text-sm text-muted-foreground">
        {`${bookmarks.length} saved propert${bookmarks.length === 1 ? "y" : "ies"}`}
      </p>
      <BookmarksList initialBookmarks={bookmarks} />
    </main>
  );
}

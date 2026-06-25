import { EmptyState } from "@/components/display/empty-state";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { BookmarkedPropertiesTable } from "@/components/properties/bookmarked-properties-table";
import { requireRole } from "@/lib/auth/guards";
import { properties } from "@/lib/frontend/placeholders";

export default async function BookmarksPage() {
  const session = await requireRole(["USER", "AGENT", "ADMIN"], "/bookmarks");

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          title="Not authorized"
          description="Bookmarks are available to signed-in users."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Bookmarks"
        description="Bookmark properties from their detail pages and use them as the starting point for resale alerts."
      />
      <PlaceholderPanel
        title="Your bookmarked properties"
        description="Hardcoded bookmark rows for now until bookmark CRUD is connected."
      >
        <BookmarkedPropertiesTable properties={properties} />
      </PlaceholderPanel>
    </AppShell>
  );
}

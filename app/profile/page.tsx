import { EmptyState } from "@/components/display/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireRole } from "@/lib/auth/guards";
import { signedInRoles } from "@/lib/auth/permissions";

export default async function ProfilePage() {
  const session = await requireRole(signedInRoles, "/profile");

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          title="Not authorized"
          description="Profile editing is available to signed-in users."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Profile"
        description="View your signed-in account and edit placeholder profile details."
      />
      <ProfileForm
        initialName={session.user.name}
        initialEmail={session.user.email}
        role={session.user.role}
      />
    </AppShell>
  );
}

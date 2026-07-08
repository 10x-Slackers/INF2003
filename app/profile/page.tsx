import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSignedIn } from "@/lib/permissions";
import { getUserById } from "@/lib/tables/users";
import { ProfileForm } from "@/components/profile/profile-form";
import { ROUTES } from "@/lib/routes";

export default async function ProfilePage() {
  const session = await auth();
  if (!session || !isSignedIn(session.user.role)) {
    redirect(ROUTES.LOGIN);
  }
  const user = await getUserById(session.user.id);
  if (!user) redirect(ROUTES.LOGIN);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">Edit profile</h1>
      <ProfileForm user={user} />
    </main>
  );
}

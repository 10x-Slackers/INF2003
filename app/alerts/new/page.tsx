import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSignedIn } from "@/lib/permissions";
import { listTowns } from "@/lib/tables/towns/functions";
import { listFlatTypes, listFlatModels } from "@/lib/tables/lookups/functions";
import { AlertForm } from "@/components/alerts/alert-form";
import { ROUTES } from "@/lib/routes";

export default async function NewAlertPage() {
  const session = await auth();
  if (!isSignedIn(session?.user?.role)) {
    redirect(ROUTES.LOGIN);
  }

  const [towns, flatTypes, flatModels] = await Promise.all([
    listTowns(),
    listFlatTypes(),
    listFlatModels(),
  ]);

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">New alert</h1>
      <p className="text-sm text-muted-foreground">
        You will be notified when new transactions match your filters.
      </p>
      <AlertForm towns={towns} flatTypes={flatTypes} flatModels={flatModels} />
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAgent } from "@/lib/permissions";
import { listTowns } from "@/lib/tables/towns/functions";
import { PropertyForm } from "@/components/properties/property-form";
import { ROUTES } from "@/lib/routes";

export default async function NewPropertyPage() {
  const session = await auth();
  if (!isAgent(session?.user?.role)) {
    redirect("/login");
  }

  const towns = await listTowns();

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">New property</h1>
      <p className="text-sm text-muted-foreground">
        Please check if the property already exists first at{" "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href={ROUTES.PROPERTIES}
        >
          the properties page
        </Link>{" "}
        before creating a new one.
      </p>
      <PropertyForm towns={towns} />
    </main>
  );
}

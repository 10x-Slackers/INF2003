import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export default function NotFound() {
  return (
    <main className="container mx-auto flex flex-col gap-4 px-5 py-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you requested is unavailable.
      </p>
      <div>
        <Button asChild>
          <Link href={ROUTES.HOME}>Return home</Link>
        </Button>
      </div>
    </main>
  );
}

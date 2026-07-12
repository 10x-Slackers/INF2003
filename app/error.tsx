"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container mx-auto flex flex-col gap-4 px-5 py-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">Please try again.</p>
      <div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}

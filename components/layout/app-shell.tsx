import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("container mx-auto flex-1 px-4 py-8", className)}>
      {children}
    </main>
  );
}

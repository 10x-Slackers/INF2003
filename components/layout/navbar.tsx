"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const primaryLinks = [
  { href: "/", label: "Overview" },
  { href: "/properties", label: "Properties" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user.role as UserRole | undefined;
  const isAdmin = role === "ADMIN";

  return (
    <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3">
      <Link href="/" className="text-lg font-semibold">
        HDB Trackr
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <nav className="flex items-center justify-end gap-4">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                (pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href))) &&
                  "text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {status === "loading" && (
          <span className="text-sm text-muted-foreground">Loading...</span>
        )}

        {status !== "loading" &&
          (session?.user ? (
            <div className="flex items-center gap-3 ">
              <Link
                className={cn(
                  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  pathname === "/bookmarks" && "text-foreground",
                )}
                href="/bookmarks"
              >
                Bookmarks
              </Link>
              <Link
                className={cn(
                  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  pathname === "/alerts" && "text-foreground",
                )}
                href="/alerts"
              >
                Alerts
              </Link>
              {isAdmin && (
                <Link
                  className={cn(
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    pathname === "/admin" && "text-foreground",
                  )}
                  href="/admin"
                >
                  Admin
                </Link>
              )}
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                {session.user.name}
              </span>
              <Button
                variant="outline"
                onClick={() => signOut({ redirectTo: "/" })}
              >
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Link
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                href="/login"
              >
                Login
              </Link>
              <Button asChild variant="outline">
                <Link href="/signup">Signup</Link>
              </Button>
            </>
          ))}
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth";
import { canAccessAdmin, canCreateTransaction } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user.role as UserRole | undefined;
  const isAdmin = canAccessAdmin(role);
  const canManageTransactions = canCreateTransaction(role);
  const signedInLinks = [
    ...(canManageTransactions
      ? [{ href: "/transactions", label: "Transactions" }]
      : []),
    { href: "/bookmarks", label: "Bookmarks" },
    { href: "/alerts", label: "Alerts" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const links = session?.user
    ? [...primaryLinks, ...signedInLinks]
    : primaryLinks;

  return (
    <div className="container mx-auto grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3">
      <Link href="/" className="text-lg font-semibold">
        HDB Trackr
      </Link>

      <nav className="flex flex-wrap items-center justify-center gap-4">
        {links.map((link) => (
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

      <div className="flex flex-wrap items-center justify-end gap-3">
        {status === "loading" && (
          <span className="text-sm text-muted-foreground">Loading...</span>
        )}

        {status !== "loading" &&
          (session?.user ? (
            <div className="flex items-center gap-3 ">
              <Link
                className={cn(
                  "hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline",
                  pathname === "/profile" && "text-foreground",
                )}
                href="/profile"
              >
                {session.user.name}
              </Link>
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

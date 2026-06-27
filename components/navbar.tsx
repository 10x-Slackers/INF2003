"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth";
import {
  canAccessAdmin,
  canCreateTransaction,
  hasRole,
  signedInRoles,
} from "@/lib/permissions";
import { Button } from "./ui/button";

type NavLink = {
  href: string;
  label: string;
  canView: (role: UserRole | null | undefined) => boolean;
};

const links: NavLink[] = [
  { href: "/", label: "Home", canView: () => true },
  { href: "/properties", label: "Properties", canView: () => true },
  { href: "/transactions", label: "Transactions", canView: () => true },
  {
    href: "/bookmarks",
    label: "Bookmarks",
    canView: (role) => hasRole(role, signedInRoles),
  },
  {
    href: "/alerts",
    label: "Alerts",
    canView: (role) => hasRole(role, signedInRoles),
  },
  {
    href: "/agent/transactions/new",
    label: "Create transaction",
    canView: canCreateTransaction,
  },
  { href: "/admin", label: "Admin", canView: canAccessAdmin },
];

function isActivePath(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user.role;
  const visibleLinks = links.filter((link) => link.canView(role));

  return (
    <div className="container mx-auto flex h-16 items-center px-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="text-lg font-semibold">
          HDB Trackr
        </Link>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {visibleLinks.map((link) => {
          const active = isActivePath(pathname, link.href);

          return (
            <Button
              key={link.href}
              asChild
              variant={active ? "secondary" : "ghost"}
            >
              <Link href={link.href} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-2">
        {status === "loading" ? (
          <span className="text-sm text-muted-foreground">Loading...</span>
        ) : session?.user ? (
          <>
            <Link href="/profile">{session.user.name}</Link>
            <Button
              variant="outline"
              onClick={() => signOut({ redirectTo: "/" })}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Signup</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

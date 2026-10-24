import Link from "next/link";
import { Suspense } from "react";
import { StripeLink } from "@/components/home/stripe-link";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { NotificationBell } from "../notifications/notification-bell";
import { MobileNav } from "./mobile-nav";
import { NAV_LINKS } from "./nav-links";
import { UserMenu } from "./user-menu";

async function UserArea() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className="px-2 text-base text-[#333231] hover:text-[#5c6b54]">
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <UserMenu id={user.id} name={user.name} email={user.email} role={user.role} points={user.points} />
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#eeecea]">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-5 sm:px-8">
        <MobileNav />
        <Link href="/" className="text-base font-semibold tracking-[-0.04em] text-[#333231]">
          Kunchanada
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-base text-[#333231] hover:text-[#5c6b54]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <StripeLink href="/cases/new" className="bg-[#5c6b54] px-4 py-2 text-base text-white">
            File a report
          </StripeLink>
          <Suspense fallback={<Skeleton className="size-8" />}>
            <UserArea />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

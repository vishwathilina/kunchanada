"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CaseInvite } from "./case-invite";
import { notificationHref, useMarkRead, useNotifications } from "./use-notifications";

export function NotificationBell() {
  const router = useRouter();
  const { data } = useNotifications(8);
  const markRead = useMarkRead();
  const unread = data?.unread ?? 0;
  const seen = useRef<Set<string> | null>(null);

  // Toast genuinely new unread notifications that arrive while the page is open.
  useEffect(() => {
    if (!data) return;
    if (seen.current === null) {
      seen.current = new Set(data.items.map((n) => n.id));
      return;
    }
    for (const n of data.items) {
      if (!seen.current.has(n.id) && !n.readAt) {
        toast(n.title, {
          description: n.body,
          action: { label: "View", onClick: () => router.push(notificationHref(n)) },
        });
      }
      seen.current.add(n.id);
    }
  }, [data, router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unread} unread)`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              className="text-xs font-normal text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                markRead.mutate(undefined);
              }}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!data || data.items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          data.items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onSelect={(e) => e.preventDefault()}
              className="flex flex-col items-start gap-0.5"
            >
              <Link
                href={notificationHref(n)}
                onClick={() => !n.readAt && markRead.mutate([n.id])}
                className="flex w-full flex-col items-start gap-0.5"
              >
                <span className={cn("flex w-full items-center gap-2 text-sm", !n.readAt && "font-semibold")}>
                  {!n.readAt && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  <span className="truncate">{n.title}</span>
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                <span className="text-[11px] text-muted-foreground">
                  {timeAgo(n.createdAt)}
                  {n.response === "accepted" ? " · On your profile" : ""}
                  {n.response === "declined" ? " · Rejected" : ""}
                </span>
              </Link>
              <CaseInvite item={n} viewer={data.viewer} />
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-sm">
            See all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

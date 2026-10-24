"use client";

import {
  Award,
  Bell,
  CircleCheckBig,
  Flag,
  HandCoins,
  HandHelping,
  MapPin,
  Receipt,
  ShieldCheck,
  Siren,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { CaseInvite } from "@/components/notifications/case-invite";
import { notificationHref, useMarkRead, useNotifications } from "@/components/notifications/use-notifications";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  new_case_nearby: MapPin,
  case_claimed: HandHelping,
  vet_checked_in: Stethoscope,
  case_update: Bell,
  case_resolved: CircleCheckBig,
  emergency: Siren,
  badge_earned: Award,
  donation_received: HandCoins,
  vet_verified: ShieldCheck,
  expense_reviewed: Receipt,
  flag: Flag,
};

export function NotificationList() {
  const { data, isLoading } = useNotifications(50);
  const markRead = useMarkRead();

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.unread} unread · updates every 20 seconds</p>
        <Button variant="outline" size="sm" disabled={data.unread === 0 || markRead.isPending} onClick={() => markRead.mutate(undefined)}>
          Mark all as read
        </Button>
      </div>
      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No notifications yet. We&apos;ll let you know when an animal near you needs help.
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {data.items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <li key={n.id} className={cn("flex gap-3 p-4", !n.readAt && "bg-primary/5")}>
                <Link
                  href={notificationHref(n)}
                  onClick={() => !n.readAt && markRead.mutate([n.id])}
                  className="flex min-w-0 flex-1 gap-3"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      n.type === "emergency" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", !n.readAt && "font-semibold")}>{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                      {n.response === "accepted" ? " · Accepted — on your profile" : ""}
                      {n.response === "declined" ? " · Rejected" : ""}
                    </p>
                  </div>
                  {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </Link>
                <CaseInvite item={n} viewer={data.viewer} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

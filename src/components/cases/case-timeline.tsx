import {
  BadgeCheck,
  CircleCheckBig,
  FilePlus2,
  HandCoins,
  HandHelping,
  LogOut,
  MapPinCheck,
  MessageSquare,
  Receipt,
  Siren,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { CaseDetail } from "@/lib/queries/cases";
import { cn } from "@/lib/utils";

const ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  created: { icon: FilePlus2, className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  status_change: { icon: BadgeCheck, className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  note: { icon: MessageSquare, className: "bg-muted text-muted-foreground" },
  claim: { icon: HandHelping, className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  check_in: { icon: MapPinCheck, className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  leave: { icon: LogOut, className: "bg-muted text-muted-foreground" },
  treatment: { icon: Stethoscope, className: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
  escalation: { icon: Siren, className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  outcome: { icon: CircleCheckBig, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  donation: { icon: HandCoins, className: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300" },
  expense: { icon: Receipt, className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
};

export function CaseTimeline({ updates }: { updates: CaseDetail["updates"] }) {
  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
      {updates.map((u) => {
        const meta = ICONS[u.type] ?? ICONS.note!;
        const Icon = meta.icon;
        return (
          <li key={u.id} className="relative flex gap-3">
            <span className={cn("z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background", meta.className)}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm">
                {u.type === "note" && u.userName && <span className="font-medium">{u.userName}: </span>}
                {u.message}
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo(u.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

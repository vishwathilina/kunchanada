import {
  Eye,
  HandHeart,
  HeartPulse,
  Moon,
  Shield,
  Siren,
  Stethoscope,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Eye,
  Siren,
  Shield,
  Moon,
  Stethoscope,
  HeartPulse,
  HandHeart,
  Trophy,
};

export type BadgeItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  awardedAt: Date | null;
};

export function BadgeGrid({ badges, compact }: { badges: BadgeItem[]; compact?: boolean }) {
  return (
    <ul className={cn("grid gap-3", compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2")}>
      {badges.map((b) => {
        const Icon = ICONS[b.icon] ?? Trophy;
        const earned = !!b.awardedAt;
        return (
          <li
            key={b.id}
            className={cn(
              "flex gap-3 rounded-xl border p-3",
              earned ? "bg-card" : "opacity-50",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium leading-tight">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.description}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

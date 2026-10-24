import { Clock, MapPin, PawPrint, Stethoscope, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import type { Outcome } from "@/lib/constants";
import { formatKm, formatMoney, timeAgo, titleCase } from "@/lib/format";
import type { CaseListItem } from "@/lib/queries/cases";
import { OutcomeBadge, SeverityBadge, StatusBadge } from "./badges";

export function CaseCard({ c }: { c: CaseListItem }) {
  const resolved = c.status === "resolved";
  return (
    <Link
      href={`/cases/${c.id}`}
      className="group flex overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="relative w-28 shrink-0 bg-muted sm:w-36">
        {c.imageUrl ? (
          <Image
            src={c.imageUrl}
            alt={c.title}
            fill
            sizes="144px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <PawPrint className="absolute inset-0 m-auto size-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {!resolved && <SeverityBadge severity={c.severity} />}
          <StatusBadge status={c.status} />
          {c.outcome && <OutcomeBadge outcome={c.outcome as Outcome} />}
        </div>
        <h3 className="line-clamp-2 font-medium leading-snug">{c.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{titleCase(c.species)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" /> {timeAgo(resolved && c.resolvedAt ? c.resolvedAt : c.createdAt)}
          </span>
          {c.distanceMeters !== null ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {formatKm(c.distanceMeters)} away
            </span>
          ) : c.city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {c.city}
            </span>
          ) : null}
        </div>
        {!resolved && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" /> {c.volunteers}/{c.maxVolunteers} volunteers
            </span>
            <span className={`inline-flex items-center gap-1 ${c.vets === 0 ? "font-medium text-destructive" : ""}`}>
              <Stethoscope className="size-3.5" /> {c.vets}/{c.maxVets} vet{c.vetCheckedIn ? " · on site" : ""}
            </span>
          </div>
        )}
        {c.fundingGoalCents > 0 && (
          <div className="mt-auto space-y-1">
            <Progress value={Math.min(100, (c.raisedCents / c.fundingGoalCents) * 100)} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {formatMoney(c.raisedCents)} of {formatMoney(c.fundingGoalCents)} raised
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

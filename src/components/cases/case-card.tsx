import Image from "next/image";
import Link from "next/link";
import type { Outcome } from "@/lib/constants";
import { formatMoney, titleCase } from "@/lib/format";
import type { CaseListItem } from "@/lib/queries/cases";
import { OutcomeBadge, SeverityBadge, StatusBadge } from "./badges";

export function CaseCard({ c }: { c: CaseListItem }) {
  const resolved = c.status === "resolved";
  return (
    <Link href={`/cases/${c.id}`} className="group grid grid-cols-[7.5rem_minmax(0,1fr)] bg-[#e4e1dd] text-[#333231] hover:bg-[#cdc3b6]">
      <div className="relative min-h-32 bg-[#cdc3b6]">
        {c.imageUrl ? (
          <Image src={c.imageUrl} alt="" fill sizes="120px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-base">{titleCase(c.species)}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1 p-4">
        <p className="flex flex-wrap gap-x-2 text-base">
          {!resolved && <SeverityBadge severity={c.severity} />}
          <StatusBadge status={c.status} />
          {c.outcome && <OutcomeBadge outcome={c.outcome as Outcome} />}
        </p>
        <h3 className="text-lg leading-snug">{c.title}</h3>
        <p className="text-base">
          {titleCase(c.species)}
          {c.city ? ` · ${c.city}` : ""}
        </p>
        <p className="text-base">
          {c.vets}/{c.maxVets} vets · {c.volunteers}/{c.maxVolunteers} volunteers
        </p>
        {c.fundingGoalCents > 0 && (
          <p className="text-base">
            {formatMoney(c.raisedCents)} of {formatMoney(c.fundingGoalCents)}
          </p>
        )}
      </div>
    </Link>
  );
}

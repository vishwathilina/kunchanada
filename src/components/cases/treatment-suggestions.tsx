import { BookOpenCheck, Info } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Outcome } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import type { SuggestionSummary } from "@/lib/recommendations";
import { OutcomeBadge } from "./badges";

export function TreatmentSuggestions({ summary, species }: { summary: SuggestionSummary; species: string }) {
  const rate = summary.withOutcome > 0 ? Math.round((summary.positive / summary.withOutcome) * 100) : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenCheck className="size-5 text-primary" /> What worked before
        </CardTitle>
        <CardDescription>
          {summary.matched > 0
            ? `${summary.matched} past ${titleCase(species).toLowerCase()} case${summary.matched > 1 ? "s" : ""} with similar injuries${
                rate !== null ? ` · ${rate}% ended well` : ""
              }`
            : "No similar past treatments yet. Add injury tags so future cases can learn from this one."}
        </CardDescription>
      </CardHeader>
      {summary.suggestions.length > 0 && (
        <CardContent className="space-y-4">
          {summary.suggestions.map((s) => (
            <div key={s.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium leading-snug">{s.diagnosis}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.overlap} shared {s.overlap === 1 ? "injury" : "injuries"} · {s.vetName} ·{" "}
                    <Link href={`/cases/${s.caseId}`} className="hover:underline">
                      {s.caseTitle}
                    </Link>
                  </p>
                </div>
                {s.outcome ? <OutcomeBadge outcome={s.outcome as Outcome} /> : <Badge variant="outline">Ongoing</Badge>}
              </div>
              <div className="flex flex-wrap gap-1">
                {s.injuryTags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[11px]">
                    {titleCase(t)}
                  </Badge>
                ))}
              </div>
              {s.medications.length > 0 && (
                <ul className="space-y-0.5 text-sm">
                  {s.medications.map((m, i) => (
                    <li key={i}>
                      <span className="font-medium">{m.name}</span>{" "}
                      <span className="text-muted-foreground">
                        {m.dose} · {m.route} · {m.frequency}
                        {m.durationDays ? ` · ${m.durationDays} days` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {s.procedures && <p className="text-sm text-muted-foreground">{s.procedures}</p>}
            </div>
          ))}
          <p className="flex gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Historical reports from community vets, not medical advice. Dosages must be decided by a qualified vet who has
            examined the animal.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import type { Outcome } from "@/lib/constants";
import { timeAgo, titleCase } from "@/lib/format";
import type { CaseDetail } from "@/lib/queries/cases";
import { OutcomeBadge } from "./badges";

export function TreatmentReportCard({ t }: { t: CaseDetail["treatments"][number] }) {
  const r = t.report;
  return (
    <article className="space-y-3 rounded-xl border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{r.diagnosis}</h4>
          <p className="text-xs text-muted-foreground">
            {t.vetName}
            {t.clinicName ? ` · ${t.clinicName}` : ""} · {timeAgo(r.createdAt)}
          </p>
        </div>
        {r.outcome ? <OutcomeBadge outcome={r.outcome as Outcome} /> : <Badge variant="outline">Ongoing</Badge>}
      </header>
      <div className="flex flex-wrap gap-1">
        {r.injuryTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[11px]">
            {titleCase(tag)}
          </Badge>
        ))}
      </div>
      {r.medications.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-3 font-medium">Drug</th>
                <th className="py-1 pr-3 font-medium">Dose</th>
                <th className="py-1 pr-3 font-medium">Route</th>
                <th className="py-1 pr-3 font-medium">Frequency</th>
                <th className="py-1 font-medium">Days</th>
              </tr>
            </thead>
            <tbody>
              {r.medications.map((m, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1.5 pr-3 font-medium">{m.name}</td>
                  <td className="py-1.5 pr-3">{m.dose}</td>
                  <td className="py-1.5 pr-3">{m.route}</td>
                  <td className="py-1.5 pr-3">{m.frequency}</td>
                  <td className="py-1.5">{m.durationDays ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.procedures && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground">Procedures</h5>
          <p className="text-sm whitespace-pre-line">{r.procedures}</p>
        </div>
      )}
      {r.notes && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground">Follow-up notes</h5>
          <p className="text-sm whitespace-pre-line">{r.notes}</p>
        </div>
      )}
    </article>
  );
}

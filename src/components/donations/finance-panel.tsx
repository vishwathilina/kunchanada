import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatMoney, timeAgo } from "@/lib/format";
import type { CaseDetail } from "@/lib/queries/cases";
import { cn } from "@/lib/utils";

const expenseStatusClass = {
  approved: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
} as const;

export function FundingSummary({ c }: { c: Pick<CaseDetail, "raisedCents" | "spentCents" | "fundingGoalCents"> }) {
  const balance = c.raisedCents - c.spentCents;
  return (
    <div className="space-y-3">
      {c.fundingGoalCents > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold">{formatMoney(c.raisedCents)}</span>
            <span className="text-sm text-muted-foreground">of {formatMoney(c.fundingGoalCents)} goal</span>
          </div>
          <Progress value={Math.min(100, (c.raisedCents / c.fundingGoalCents) * 100)} className="h-2" />
        </div>
      )}
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-muted/60 p-2">
          <dt className="text-xs text-muted-foreground">Raised</dt>
          <dd className="font-semibold">{formatMoney(c.raisedCents)}</dd>
        </div>
        <div className="rounded-lg bg-muted/60 p-2">
          <dt className="text-xs text-muted-foreground">Spent</dt>
          <dd className="font-semibold">{formatMoney(c.spentCents)}</dd>
        </div>
        <div className="rounded-lg bg-muted/60 p-2">
          <dt className="text-xs text-muted-foreground">{balance >= 0 ? "Balance" : "From general fund"}</dt>
          <dd className={cn("font-semibold", balance < 0 && "text-primary")}>{formatMoney(Math.abs(balance))}</dd>
        </div>
      </dl>
    </div>
  );
}

export function FinanceLedger({ c }: { c: Pick<CaseDetail, "donations" | "expenses"> }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Donations</h4>
        {c.donations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No donations yet. Be the first.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {c.donations.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-2 p-2.5 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{d.isAnonymous || !d.donorName ? "Anonymous" : d.donorName}</div>
                  {d.message && <p className="truncate text-xs text-muted-foreground">&ldquo;{d.message}&rdquo;</p>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold">{formatMoney(d.amountCents, d.currency)}</div>
                  {d.completedAt && <div className="text-[11px] text-muted-foreground">{timeAgo(d.completedAt)}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Expenses</h4>
        {c.expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses logged yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {c.expenses.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-2 p-2.5 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{e.description}</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{e.userName}</span>
                    <Badge variant="outline" className={cn("border-transparent text-[10px] capitalize", expenseStatusClass[e.status])}>
                      {e.status}
                    </Badge>
                    {e.receiptUrl && (
                      <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                        Receipt <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="shrink-0 font-semibold">{formatMoney(e.amountCents)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

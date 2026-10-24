import { Badge } from "@/components/ui/badge";
import {
  OUTCOME_LABELS,
  POSITIVE_OUTCOMES,
  SEVERITY_META,
  STATUS_LABELS,
  type CaseStatus,
  type Outcome,
  type Severity,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const severityClasses: Record<Severity, string> = {
  critical: "bg-red-600 text-white border-transparent",
  urgent: "bg-orange-500 text-white border-transparent",
  stable: "bg-green-600 text-white border-transparent",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <Badge className={cn(severityClasses[severity], className)}>
      {severity === "critical" && <span className="mr-0.5 size-1.5 animate-pulse rounded-full bg-white" />}
      {SEVERITY_META[severity].label}
    </Badge>
  );
}

const statusClasses: Record<CaseStatus, string> = {
  reported: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  verified: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  assigned: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  in_treatment: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  resolved: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", statusClasses[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function OutcomeBadge({ outcome, className }: { outcome: Outcome; className?: string }) {
  const positive = POSITIVE_OUTCOMES.includes(outcome);
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        positive
          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          : outcome === "deceased"
            ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {OUTCOME_LABELS[outcome]}
    </Badge>
  );
}

import {
  OUTCOME_LABELS,
  SEVERITY_META,
  STATUS_LABELS,
  type CaseStatus,
  type Outcome,
  type Severity,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const severityTone: Record<Severity, string> = {
  critical: "text-[#8f3d32]",
  urgent: "text-[#333231]",
  stable: "text-[#5c6b54]",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return <span className={cn("text-base", severityTone[severity], className)}>{SEVERITY_META[severity].label}</span>;
}

export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return <span className={cn("text-base text-[#333231]", className)}>{STATUS_LABELS[status]}</span>;
}

export function OutcomeBadge({ outcome, className }: { outcome: Outcome; className?: string }) {
  return <span className={cn("text-base text-[#333231]", className)}>{OUTCOME_LABELS[outcome]}</span>;
}

import type { Severity, Species } from "./constants";

export type ReadingStep = {
  action: string;
  because: string;
  sourceCaseId: string;
  sourceCaseTitle: string;
};

export type PhotoReading = {
  species: Species;
  commonName: string;
  confidence: "low" | "medium" | "high";
  injuryTags: string[];
  severity: Severity;
  visibleFindings: string[];
  fieldSteps: string[];
  similar: { matched: number; positive: number; withOutcome: number };
  brief: {
    headline: string;
    steps: ReadingStep[];
    watchFor: string[];
    gaps: string;
  } | null;
  model: string;
  readAt: string;
};

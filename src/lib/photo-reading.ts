import "server-only";
import { z } from "zod";
import { UserError } from "./action-state";
import { INJURY_TAGS, SEVERITIES, SPECIES, type Severity, type Species } from "./constants";
import { VISION_MODEL, completeJson, isVisionConfigured } from "./openrouter";
import type { PhotoReading } from "./photo-reading-types";
import { findSimilarTreatments, type Suggestion } from "./recommendations";

export type { PhotoReading } from "./photo-reading-types";
export { isVisionConfigured };

const hits = new Map<string, number[]>();

export function limitPhotoReads(userId: string) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 60 * 60_000);
  if (recent.length >= 8) {
    throw new UserError("You've used photo reading several times this hour. Wait a bit, then try again.");
  }
  recent.push(now);
  hits.set(userId, recent);
}

const assessmentSchema = z.object({
  species: z.string(),
  commonName: z.string().max(80).optional().default(""),
  confidence: z.enum(["low", "medium", "high"]).optional().default("low"),
  injuryTags: z.array(z.string()).optional().default([]),
  visibleFindings: z.array(z.string()).max(8).optional().default([]),
  fieldSteps: z.array(z.string()).max(6).optional().default([]),
  severity: z.string().optional(),
});

const briefSchema = z.object({
  headline: z.string(),
  steps: z
    .array(
      z.object({
        action: z.string(),
        because: z.string(),
        sourceCaseId: z.string(),
      }),
    )
    .max(8),
  watchFor: z.array(z.string()).max(6).optional().default([]),
  gaps: z.string().optional().default(""),
});

function lines(values: string[], max: number) {
  return values
    .map((v) => v.replace(/\s+/g, " ").trim())
    .filter((v) => v.length > 0 && v.length <= 280)
    .slice(0, max);
}

function asSpecies(value: string): Species {
  const hit = SPECIES.find((s) => s === value.trim().toLowerCase());
  return hit ?? "other";
}

function asSeverity(value: string | undefined): Severity {
  const hit = SEVERITIES.find((s) => s === value?.trim().toLowerCase());
  return hit ?? "urgent";
}

function assertPublicHttps(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UserError("One of the photos isn't a usable address.");
  }
  if (parsed.protocol !== "https:") throw new UserError("Photos need a public https address so they can be read.");
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)
  ) {
    throw new UserError("Photos need a public https address so they can be read.");
  }
  return parsed;
}

/** Public https photos (UploadThing) go straight to OpenRouter. No base64 bloat. */
function imagePart(url: string) {
  const parsed = assertPublicHttps(url);
  return {
    type: "image_url" as const,
    image_url: { url: parsed.toString() },
  };
}

async function briefFromRecords(species: Species, tags: string[], records: Suggestion[]) {
  if (records.length === 0) return null;
  const packet = records.slice(0, 4).map((s) => ({
    id: s.caseId,
    title: s.caseTitle,
    diagnosis: s.diagnosis,
    tags: s.injuryTags,
    medications: s.medications,
    procedures: s.procedures?.slice(0, 700) ?? null,
    outcome: s.outcome,
    sharedTags: s.overlap,
  }));
  const raw = await completeJson(
    [
      "You help a vet on Kunchanada compare a new animal with past treatment records of the same species.",
      "Use only the records in the user message. Do not add drugs, doses, or procedures that are not written there.",
      "Each step's sourceCaseId must be one of the record ids.",
      "If two records disagree, say so in gaps instead of picking a winner.",
      "This is a similarity check, not a prescription. Do not tell the vet to give a dose without examining the animal.",
      "Reply with JSON: { headline, steps: [{ action, because, sourceCaseId }], watchFor, gaps }.",
    ].join(" "),
    [
      {
        type: "text",
        text: JSON.stringify({
          species,
          visibleTags: tags,
          records: packet,
        }),
      },
    ],
  );
  const parsed = briefSchema.safeParse(raw);
  if (!parsed.success) return null;
  const known = new Map(records.map((s) => [s.caseId, s.caseTitle]));
  const steps = parsed.data.steps
    .filter((step) => known.has(step.sourceCaseId))
    .slice(0, 6)
    .map((step) => ({
      action: step.action.replace(/\s+/g, " ").trim().slice(0, 400),
      because: step.because.replace(/\s+/g, " ").trim().slice(0, 400),
      sourceCaseId: step.sourceCaseId,
      sourceCaseTitle: known.get(step.sourceCaseId)!,
    }))
    .filter((step) => step.action && step.because);
  if (steps.length === 0 && !parsed.data.gaps) return null;
  return {
    headline: parsed.data.headline.replace(/\s+/g, " ").trim().slice(0, 180),
    steps,
    watchFor: lines(parsed.data.watchFor, 5),
    gaps: parsed.data.gaps.replace(/\s+/g, " ").trim().slice(0, 400),
  };
}

export async function buildPhotoReading(imageUrls: string[]): Promise<PhotoReading> {
  const urls = [...new Set(imageUrls.map((u) => u.trim()).filter(Boolean))].slice(0, 3);
  if (urls.length === 0) throw new UserError("Add a photo first.");

  const images = await Promise.all(urls.map((url) => imagePart(url)));
  const raw = await completeJson(
    [
      "You look at photographs for a community animal-rescue desk in Sri Lanka.",
      "Identify the animal and only the injuries you can actually see. Do not invent fractures, internal injuries, or drug doses.",
      `species must be one of: ${SPECIES.join(", ")}.`,
      `injuryTags must be chosen only from: ${INJURY_TAGS.join(", ")}.`,
      `severity must be one of: ${SEVERITIES.join(", ")}.`,
      "fieldSteps are for the person standing next to the animal before a vet arrives: safety, warmth, not moving a suspected fracture. No medicines.",
      "Reply with JSON: { species, commonName, confidence, injuryTags, visibleFindings, fieldSteps, severity }.",
      "confidence is low, medium, or high.",
    ].join(" "),
    [{ type: "text", text: "Read these photos of one animal." }, ...images],
  );

  const parsed = assessmentSchema.safeParse(raw);
  if (!parsed.success) throw new UserError("The photo reading wasn't readable. Try again.");
  const species = asSpecies(parsed.data.species);
  const injuryTags = [...new Set(parsed.data.injuryTags.filter((tag) => (INJURY_TAGS as readonly string[]).includes(tag)))].slice(0, 8);
  const summary = await findSimilarTreatments({ species, tags: injuryTags, limit: 4 });
  const brief = await briefFromRecords(species, injuryTags, summary.suggestions);

  return {
    species,
    commonName: parsed.data.commonName.trim() || species,
    confidence: parsed.data.confidence,
    injuryTags,
    severity: asSeverity(parsed.data.severity),
    visibleFindings: lines(parsed.data.visibleFindings, 5),
    fieldSteps: lines(parsed.data.fieldSteps, 4),
    similar: { matched: summary.matched, positive: summary.positive, withOutcome: summary.withOutcome },
    brief,
    model: VISION_MODEL,
    readAt: new Date().toISOString(),
  };
}

export function parseStoredReading(value: unknown): PhotoReading | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<PhotoReading>;
  if (!row.species || !row.readAt) return null;
  return row as PhotoReading;
}

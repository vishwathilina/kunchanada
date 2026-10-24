import { ScanSearch } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { titleCase } from "@/lib/format";
import type { PhotoReading } from "@/lib/photo-reading-types";
import { ReadPhotosButton } from "./read-photos-button";

export function PhotoReadingPanel({
  reading,
  reportedSpecies,
  caseId,
  canRead,
}: {
  reading: PhotoReading | null;
  reportedSpecies?: string;
  caseId?: string;
  canRead?: boolean;
}) {
  const speciesDiffers = reading && reportedSpecies && reading.species !== reportedSpecies;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanSearch className="size-5 text-primary" /> Photo reading
        </CardTitle>
        <CardDescription>
          {reading
            ? `Read by ${reading.model} · ${reading.confidence} confidence`
            : "MiniMax reads the photos, then checks them against past treatments of the same species."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reading ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{titleCase(reading.commonName || reading.species)}</Badge>
              <Badge variant="secondary">{titleCase(reading.severity)}</Badge>
              {reading.injuryTags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {titleCase(tag)}
                </Badge>
              ))}
            </div>
            {speciesDiffers && (
              <p className="text-sm">
                The photos look like a {titleCase(reading.species).toLowerCase()}. The report says{" "}
                {titleCase(reportedSpecies).toLowerCase()}.
              </p>
            )}
            {reading.visibleFindings.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {reading.visibleFindings.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            {reading.fieldSteps.length > 0 && (
              <div className="space-y-1 text-sm">
                <p className="font-medium">Before a vet arrives</p>
                <ol className="list-decimal space-y-1 pl-5">
                  {reading.fieldSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {reading.similar.matched > 0
                ? `${reading.similar.matched} past ${titleCase(reading.species).toLowerCase()} record${reading.similar.matched === 1 ? "" : "s"} share these injuries${
                    reading.similar.withOutcome > 0
                      ? ` · ${reading.similar.positive} of ${reading.similar.withOutcome} with an outcome ended well`
                      : ""
                  }.`
                : `No past ${titleCase(reading.species).toLowerCase()} treatment on Kunchanada shares these injuries yet.`}
            </p>
            {reading.brief && (
              <div className="space-y-3 border-t pt-3">
                <p className="font-medium">{reading.brief.headline}</p>
                <ol className="space-y-3">
                  {reading.brief.steps.map((step) => (
                    <li key={`${step.sourceCaseId}-${step.action}`} className="text-sm">
                      <p>{step.action}</p>
                      <p className="text-muted-foreground">{step.because}</p>
                      <Link href={`/cases/${step.sourceCaseId}`} className="text-primary hover:underline">
                        From {step.sourceCaseTitle}
                      </Link>
                    </li>
                  ))}
                </ol>
                {reading.brief.watchFor.length > 0 && (
                  <p className="text-sm">Watch for {reading.brief.watchFor.join("; ")}.</p>
                )}
                {reading.brief.gaps && <p className="text-sm text-muted-foreground">{reading.brief.gaps}</p>}
                <p className="text-xs text-muted-foreground">
                  Steps quote past Kunchanada records for this species. A vet still has to examine this animal. Doses are not
                  instructions until they are.
                </p>
              </div>
            )}
          </>
        ) : null}
        {canRead && caseId && <ReadPhotosButton caseId={caseId} label={reading ? "Read the photos again" : "Read the photos"} />}
      </CardContent>
    </Card>
  );
}

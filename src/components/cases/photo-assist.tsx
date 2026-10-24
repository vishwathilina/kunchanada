"use client";

import { Loader2, ScanSearch } from "lucide-react";
import { useState } from "react";
import { assessPhotosAction } from "@/actions/vision";
import { Button } from "@/components/ui/button";
import { titleCase } from "@/lib/format";
import type { PhotoReading } from "@/lib/photo-reading-types";
import type { Severity } from "@/lib/constants";

export function PhotoAssist({
  imageUrls,
  onApply,
}: {
  imageUrls: string[];
  onApply: (reading: PhotoReading) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<PhotoReading | null>(null);

  return (
    <div className="space-y-3 rounded-xl bg-muted/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Read the photos for the species and visible injuries, then check them against past treatments.
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || imageUrls.length === 0}
          onClick={async () => {
            setPending(true);
            setError(null);
            const result = await assessPhotosAction(imageUrls);
            setPending(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setReading(result.reading);
            onApply(result.reading);
          }}
        >
          {pending ? <Loader2 className="animate-spin" /> : <ScanSearch />}
          Identify the animal
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {reading && (
        <div className="space-y-2 text-sm">
          <p>
            Looks like {titleCase(reading.commonName)} · {reading.confidence} confidence · {titleCase(reading.severity as Severity)}
          </p>
          {reading.visibleFindings[0] && <p>{reading.visibleFindings[0]}</p>}
          <p className="text-muted-foreground">
            {reading.similar.matched > 0
              ? `${reading.similar.matched} past ${reading.species} record${reading.similar.matched === 1 ? "" : "s"} match. The vet page will show what was done.`
              : "No matching past treatment yet. The tags you keep will make the next one easier to find."}
          </p>
        </div>
      )}
    </div>
  );
}

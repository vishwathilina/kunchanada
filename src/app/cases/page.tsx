import { PawPrint } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CaseCard } from "@/components/cases/case-card";
import { CaseFilters, type CaseFilterValues } from "@/components/cases/case-filters";
import { CasesMap } from "@/components/map/cases-map";
import { StoryFrame } from "@/components/media/story-frame";
import { PHOTOS } from "@/lib/photos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { SEVERITIES, SPECIES, type Severity } from "@/lib/constants";
import { listCases } from "@/lib/queries/cases";

export const metadata: Metadata = { title: "Cases" };

type SearchParams = PageProps<"/cases">["searchParams"];

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

async function CasesContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  const scopeParam = one(sp.scope);
  const scope = scopeParam === "resolved" || scopeParam === "all" ? scopeParam : "open";
  const severityParam = one(sp.severity);
  const severity = SEVERITIES.includes(severityParam as Severity) ? (severityParam as Severity) : undefined;
  const speciesParam = one(sp.species);
  const species = SPECIES.includes(speciesParam as (typeof SPECIES)[number]) ? speciesParam : undefined;
  const nearParam = one(sp.near);
  const radiusKm = Math.min(200, Math.max(1, Number(one(sp.r)) || 15));

  let center: { lat: number; lng: number } | null = null;
  if (nearParam === "home" && user) center = { lat: user.lat, lng: user.lng };
  if (nearParam === "here") {
    const lat = Number(one(sp.lat));
    const lng = Number(one(sp.lng));
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      center = { lat, lng };
    }
  }

  const items = await listCases({
    scope,
    severity,
    species,
    near: center ? { ...center, radiusKm } : undefined,
  });

  const values: CaseFilterValues = {
    scope,
    severity,
    species,
    near: center ? nearParam : undefined,
    lat: nearParam === "here" ? one(sp.lat) : undefined,
    lng: nearParam === "here" ? one(sp.lng) : undefined,
    r: center ? String(radiusKm) : undefined,
  };

  return (
    <div className="space-y-4">
      <CaseFilters values={values} hasHome={!!user} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="order-2 space-y-3 lg:order-1">
          <p className="text-sm text-muted-foreground">
            {items.length} case{items.length === 1 ? "" : "s"}
            {scope !== "resolved" && " · sorted by urgency"}
          </p>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
              <PawPrint className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">No cases match these filters.</p>
              <Button asChild size="sm">
                <Link href="/cases/new">Report an animal</Link>
              </Button>
            </div>
          ) : (
            items.map((c) => <CaseCard key={c.id} c={c} />)
          )}
        </div>
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-20">
            <CasesMap
              cases={items.map((c) => ({
                id: c.id,
                title: c.title,
                lat: c.lat,
                lng: c.lng,
                severity: c.severity,
                status: c.status,
                imageUrl: c.imageUrl,
              }))}
              center={center}
              radiusKm={center ? radiusKm : undefined}
              height={480}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CasesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full max-w-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function CasesPage(props: PageProps<"/cases">) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 sm:px-8">
      <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="max-w-2xl">
          <h1 className="text-3xl">Open cases</h1>
          <p className="mt-2 text-base">
            Critical cases with nobody on the way sit at the top. Claim a slot if you can get there.
          </p>
          <Button asChild className="mt-5 h-12 bg-[#5c6b54] px-5 text-base text-white">
            <Link href="/cases/new">File a report</Link>
          </Button>
        </div>
        <StoryFrame photo={PHOTOS.elephantRescue} className="aspect-[4/3]" sizes="256px" />
      </div>
      <Suspense fallback={<CasesSkeleton />}>
        <CasesContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

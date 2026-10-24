import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TreatmentSuggestions } from "@/components/cases/treatment-suggestions";
import { StoryFrame } from "@/components/media/story-frame";
import { PHOTOS } from "@/lib/photos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getCaseDetail } from "@/lib/queries/cases";
import { findSimilarTreatments } from "@/lib/recommendations";
import { TreatmentForm } from "./treatment-form";

export const metadata: Metadata = { title: "Treatment report" };

const UUID = /^[0-9a-f-]{36}$/i;

async function TreatmentContent({ params }: { params: PageProps<"/cases/[id]/treatment">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireRole(["vet"], `/cases/${id}/treatment`);
  const c = await getCaseDetail(id);
  if (!c) notFound();

  const mine = c.activeVets.find((v) => v.userId === user.id);
  const allowed = user.isVerifiedVet && !!mine;
  const summary = await findSimilarTreatments({ excludeCaseId: c.id, species: c.species, tags: c.injuryTags });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{c.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {allowed ? (
            <TreatmentForm caseId={c.id} initialTags={c.injuryTags} />
          ) : (
            <Alert>
              <AlertTitle>You can&apos;t file a report for this case yet</AlertTitle>
              <AlertDescription>
                {user.isVerifiedVet
                  ? "Claim the vet slot on the case page first."
                  : "Your vet license is still awaiting verification by an admin."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <TreatmentSuggestions summary={summary} species={c.species} />
    </div>
  );
}

export default function TreatmentPage(props: PageProps<"/cases/[id]/treatment">) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <Suspense fallback={<Skeleton className="h-6 w-32" />}>
        <BackLink params={props.params} />
      </Suspense>
      <div className="grid items-center gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
        <StoryFrame photo={PHOTOS.bearClinic} className="h-32 rounded-2xl sm:h-36" sizes="220px" />
        <div>
          <h1 className="text-3xl font-medium">Treatment report</h1>
          <p className="text-sm text-muted-foreground">
            What you file here is what the next vet sees when a similar case comes in.
          </p>
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <TreatmentContent params={props.params} />
      </Suspense>
    </div>
  );
}

async function BackLink({ params }: { params: PageProps<"/cases/[id]/treatment">["params"] }) {
  const { id } = await params;
  return (
    <Link href={`/cases/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Back to case
    </Link>
  );
}

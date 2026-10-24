import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { StoryFrame } from "@/components/media/story-frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PHOTOS } from "@/lib/photos";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { NewCaseForm } from "./new-case-form";

export const metadata: Metadata = { title: "Report an animal" };

async function FormForUser() {
  const user = await requireUser("/cases/new");
  return <NewCaseForm defaultCity={user.city} />;
}

export default function NewCasePage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <StoryFrame photo={PHOTOS.cheetahField} className="h-44 rounded-2xl" sizes="768px">
        <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-4 text-sm text-white">
          Field teams handle the animal. Your report is what gets them there.
        </figcaption>
      </StoryFrame>
      <div>
        <h1 className="text-3xl font-medium">Report an animal in need</h1>
        <p className="text-muted-foreground">
          Nearby vets and volunteers will be alerted as soon as you submit.
        </p>
      </div>
      <Alert>
        <ShieldAlert />
        <AlertTitle>Stay safe</AlertTitle>
        <AlertDescription>
          Don&apos;t approach an aggressive or frightened animal, and don&apos;t stand in traffic. Keep a safe distance and
          wait for responders if in doubt.
        </AlertDescription>
      </Alert>
      <Suspense fallback={<Skeleton className="h-[900px] w-full rounded-xl" />}>
        <FormForUser />
      </Suspense>
    </div>
  );
}

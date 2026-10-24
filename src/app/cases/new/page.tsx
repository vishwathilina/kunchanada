import type { Metadata } from "next";
import { Suspense } from "react";
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
    <div className="mx-auto w-full max-w-3xl space-y-8 px-5 py-10 sm:px-8">
      <div className="max-w-xl">
        <h1 className="text-4xl">File a report</h1>
        <p className="mt-3 text-base">
          A photo, the place, and what you can see. Nearby vets and volunteers are asked as soon as you send it.
        </p>
        <p className="mt-3 text-base">
          Stay back from a frightened animal and out of the road. Wait for the people who are asked.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[900px] w-full" />}>
        <FormForUser />
      </Suspense>
    </div>
  );
}

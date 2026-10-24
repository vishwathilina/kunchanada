import { eq } from "drizzle-orm";
import { PawPrint, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CaseCard } from "@/components/cases/case-card";
import { AvailabilityToggle } from "@/components/gamify/availability-toggle";
import { StoryFrame } from "@/components/media/story-frame";
import { PHOTOS } from "@/lib/photos";
import { BadgeGrid } from "@/components/gamify/badge-grid";
import { LicenseCard } from "@/components/gamify/license-card";
import { ProfileForm } from "@/components/gamify/profile-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { users, vetProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { listCases } from "@/lib/queries/cases";
import { getRespondedCaseIds, getUserBadges, getUserStats } from "@/lib/queries/users";

export const metadata: Metadata = { title: "Dashboard" };

async function Welcome({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const sp = await searchParams;
  if (sp.welcome !== "1") return null;
  return (
    <Alert>
      <Sparkles />
      <AlertTitle>Welcome to Kunchanada</AlertTitle>
      <AlertDescription>
        Set your location and radius so we can alert you about animals nearby. Then browse open cases or report one.
      </AlertDescription>
    </Alert>
  );
}

async function DashboardBody() {
  const user = await requireUser("/dashboard");
  const [[full], [vet], reported, activeIds, badges, stats] = await Promise.all([
    db
      .select({ bio: users.bio, phone: users.phone })
      .from(users)
      .where(eq(users.id, user.id)),
    db.select().from(vetProfiles).where(eq(vetProfiles.userId, user.id)),
    listCases({ reporterId: user.id, scope: "all", limit: 8 }),
    getRespondedCaseIds(user.id, true),
    getUserBadges(user.id),
    getUserStats(user.id),
  ]);
  const active = await listCases({ ids: activeIds.map((r) => r.caseId), scope: "all" });
  const earned = badges.filter((b) => b.awardedAt);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-4">
            <StoryFrame photo={PHOTOS.falconClinic} className="hidden h-20 w-28 rounded-xl sm:block" sizes="112px" />
            <div>
            <h1 className="text-3xl font-medium">Hi, {user.name.split(" ")[0]}</h1>
            <p className="text-muted-foreground">
              {user.points.toLocaleString()} points · rank #{stats.rank} · {user.city}
            </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/profile/${user.id}`}>Public profile</Link>
            </Button>
            <Button asChild>
              <Link href="/cases/new">Report an animal</Link>
            </Button>
          </div>
        </div>

        <AvailabilityToggle initial={user.isAvailable} />

        {user.role === "vet" && vet && (
          <LicenseCard
            licenseNumber={vet.licenseNumber}
            clinicName={vet.clinicName}
            verifiedAt={vet.verifiedAt}
            rejectedReason={vet.rejectedReason}
            licenseDocUrl={vet.licenseDocUrl}
          />
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Active responses</h2>
          {active.length === 0 ? (
            <EmptyCases text="You haven't claimed any open cases." href="/cases" label="Browse cases" />
          ) : (
            active.map((c) => <CaseCard key={c.id} c={c} />)
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your reports</h2>
          {reported.length === 0 ? (
            <EmptyCases text="No reports yet." href="/cases/new" label="Report an animal" />
          ) : (
            reported.map((c) => <CaseCard key={c.id} c={c} />)
          )}
        </section>
      </div>

      <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>
              {earned.length} of {badges.length} earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BadgeGrid badges={badges} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>Name, phone, and the area we alert you about.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              name={user.name}
              phone={full?.phone ?? user.phone ?? ""}
              city={user.city}
              bio={full?.bio ?? ""}
              lat={user.lat}
              lng={user.lng}
              serviceRadiusKm={user.serviceRadiusKm}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyCases({ text, href, label }: { text: string; href: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <PawPrint className="size-7 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button asChild size="sm" variant="outline">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <Suspense>
        <Welcome searchParams={props.searchParams} />
      </Suspense>
      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <DashboardBody />
      </Suspense>
    </div>
  );
}

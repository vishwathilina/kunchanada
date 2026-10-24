import { eq } from "drizzle-orm";
import { Award, MapPin, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaseCard } from "@/components/cases/case-card";
import { BadgeGrid } from "@/components/gamify/badge-grid";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { users } from "@/db/schema";
import { formatMoney, initials } from "@/lib/format";
import { listCases } from "@/lib/queries/cases";
import { getPublicProfile, getRespondedCaseIds, getUserBadges, getUserStats } from "@/lib/queries/users";

export async function generateMetadata({ params }: PageProps<"/profile/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, id));
  return { title: u?.name ?? "Profile" };
}

async function Profile({ params }: { params: PageProps<"/profile/[id]">["params"] }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const [stats, badges, reported, responded] = await Promise.all([
    getUserStats(id),
    getUserBadges(id),
    listCases({ reporterId: id, scope: "all", limit: 8 }),
    getRespondedCaseIds(id),
  ]);
  const helped = await listCases({ ids: responded.map((r) => r.caseId), scope: "all", limit: 8 });
  const earned = badges.filter((b) => b.awardedAt);

  const statsRow = [
    { label: "Reports", value: stats.reports },
    { label: "Cases helped", value: stats.helped },
    { label: "Check-ins", value: stats.checkins },
    { label: "Saves", value: stats.saves },
    ...(profile.role === "vet" ? [{ label: "Treatments", value: stats.treatments }] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar className="size-16 text-lg" size="lg">
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initials(profile.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{profile.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {profile.role}
            </Badge>
            {profile.vetVerifiedAt && (
              <Badge>
                <Stethoscope /> Verified vet
              </Badge>
            )}
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {profile.city}
            {profile.clinicName ? ` · ${profile.clinicName}` : ""}
          </p>
          {profile.bio && <p className="max-w-2xl text-sm">{profile.bio}</p>}
        </div>
        <div className="rounded-xl border px-4 py-3 text-right">
          <div className="text-2xl font-semibold">{profile.points.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">points · rank #{stats.rank}</div>
          {stats.donatedCents > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">Donated {formatMoney(stats.donatedCents)}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statsRow.map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent className="px-4">
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Award className="size-5 text-primary" />
          Badges ({earned.length}/{badges.length})
        </h2>
        <BadgeGrid badges={badges} compact />
      </section>

      {reported.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Reported</h2>
          <div className="space-y-3">
            {reported.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {helped.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Helped on</h2>
          <div className="space-y-3">
            {helped.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ProfilePage(props: PageProps<"/profile/[id]">) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <Profile params={props.params} />
      </Suspense>
    </div>
  );
}

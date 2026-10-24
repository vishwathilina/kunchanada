import { HandCoins, HeartHandshake, Receipt, Users } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CaseCard } from "@/components/cases/case-card";
import { DonateForm } from "@/components/donations/donate-form";
import { StoryFrame } from "@/components/media/story-frame";
import { PHOTOS } from "@/lib/photos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { getFundStats } from "@/lib/queries/funds";
import { listCases } from "@/lib/queries/cases";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = { title: "Donate" };

async function Stats() {
  const s = await getFundStats();
  const items = [
    { label: "General fund balance", value: formatMoney(Math.max(0, s.generalBalanceCents)), icon: HandCoins },
    { label: "Raised for specific animals", value: formatMoney(s.caseRaisedCents), icon: HeartHandshake },
    { label: "Spent on treatment", value: formatMoney(s.approvedSpentCents), icon: Receipt },
    { label: "Donors", value: s.donorCount.toLocaleString(), icon: Users },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="py-4">
          <CardContent className="space-y-1 px-4">
            <Icon className="size-4 text-primary" />
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </CardContent>
        </Card>
      ))}
      <p className="col-span-full text-sm text-muted-foreground">
        {s.receiptsBackedPct}% of approved spending is backed by an uploaded receipt.
      </p>
    </div>
  );
}

async function GeneralForm() {
  const user = await getCurrentUser();
  return <DonateForm defaultName={user?.name} />;
}

async function NeedyCases() {
  const cases = (await listCases({ scope: "open" }))
    .filter((c) => c.fundingGoalCents > c.raisedCents)
    .slice(0, 4);
  if (cases.length === 0) return <p className="text-sm text-muted-foreground">No open cases need funding right now.</p>;
  return (
    <div className="space-y-3">
      {cases.map((c) => (
        <CaseCard key={c.id} c={c} />
      ))}
    </div>
  );
}

async function StripeNotice() {
  await connection();
  if (isStripeConfigured()) return null;
  return (
    <Alert className="mb-4">
      <AlertTitle>Stripe not configured</AlertTitle>
      <AlertDescription>Set STRIPE_SECRET_KEY to accept donations.</AlertDescription>
    </Alert>
  );
}

async function CancelledNotice({ searchParams }: { searchParams: PageProps<"/donate">["searchParams"] }) {
  const sp = await searchParams;
  if (sp.donation !== "cancelled") return null;
  return (
    <Alert>
      <AlertTitle>Donation cancelled</AlertTitle>
      <AlertDescription>No payment was taken.</AlertDescription>
    </Alert>
  );
}

export default function DonatePage(props: PageProps<"/donate">) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-medium sm:text-4xl">Fund rescues you can see</h1>
          <p className="text-muted-foreground">
            Give to a specific animal, or to the general fund that covers cases nobody has funded yet. Every expense is
            approved by our team and published with its receipt.
          </p>
        </div>
        <StoryFrame photo={PHOTOS.volunteerDog} className="hidden aspect-[4/3] rounded-2xl lg:block" sizes="280px" />
      </div>
      <div className="grid items-center gap-4 overflow-hidden rounded-2xl border bg-card sm:grid-cols-[160px_minmax(0,1fr)]">
        <StoryFrame photo={PHOTOS.poodleCast} className="h-36 sm:h-full sm:min-h-28" sizes="160px" />
        <p className="px-4 py-3 text-sm text-muted-foreground sm:px-2">
          A cast, a course of medicine, a night at a clinic. Donations on Kunchanada are tied to a case or to the general
          fund that covers the ones nobody sponsored.
        </p>
      </div>
      <Suspense>
        <CancelledNotice searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-28 w-full rounded-xl" />}>
        <Stats />
      </Suspense>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Animals waiting on funding</h2>
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <NeedyCases />
          </Suspense>
        </section>
        <Card className="lg:sticky lg:top-20 lg:self-start">
          <CardHeader>
            <CardTitle>Give to the general fund</CardTitle>
            <CardDescription>Used wherever it&apos;s needed most.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <StripeNotice />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-80 w-full" />}>
              <GeneralForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

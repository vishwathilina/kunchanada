import { BellRing, Clock, MapPin, Phone, Stethoscope, User } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OutcomeBadge, SeverityBadge, StatusBadge } from "@/components/cases/badges";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { EmergencyPanel } from "@/components/cases/emergency-panel";
import { FlagDialog } from "@/components/cases/flag-dialog";
import { ResolveDialog } from "@/components/cases/resolve-dialog";
import { ResponderPanel } from "@/components/cases/responder-panel";
import { TreatmentReportCard } from "@/components/cases/treatment-report-card";
import { TreatmentSuggestions } from "@/components/cases/treatment-suggestions";
import { UpdateForm } from "@/components/cases/update-form";
import { DonateForm } from "@/components/donations/donate-form";
import { ExpenseDialog } from "@/components/donations/expense-dialog";
import { FinanceLedger, FundingSummary } from "@/components/donations/finance-panel";
import { CasesMap } from "@/components/map/cases-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { ESCALATION_MINUTES, EMERGENCY_RADIUS_KM, viewerContext } from "@/lib/case-permissions";
import type { Outcome } from "@/lib/constants";
import { timeAgo, titleCase } from "@/lib/format";
import { findVerifiedVetsNear } from "@/lib/geo";
import { getCaseDetail } from "@/lib/queries/cases";
import { findSimilarTreatments } from "@/lib/recommendations";

export const metadata: Metadata = { title: "Case" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = PageProps<"/cases/[id]">["params"];
type SearchParams = PageProps<"/cases/[id]">["searchParams"];

async function CaseView({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();

  const [c, user] = await Promise.all([getCaseDetail(id), getCurrentUser()]);
  if (!c || (c.isHidden && user?.role !== "admin")) notFound();

  const ctx = viewerContext(c, c.responders, user);
  const resolved = c.status === "resolved";
  const tags = [...new Set([...c.injuryTags, ...c.treatments.flatMap((t) => t.report.injuryTags)])];

  const [suggestions, emergencyContacts] = await Promise.all([
    findSimilarTreatments({ excludeCaseId: c.id, species: c.species, tags }),
    c.escalations.length > 0 && ctx.isParticipant && !resolved
      ? findVerifiedVetsNear(c.lat, c.lng, EMERGENCY_RADIUS_KM)
      : Promise.resolve(null),
  ]);

  const [hero, ...rest] = c.images;
  const showPhones = ctx.isParticipant;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        {sp.new === "1" && (
          <Alert className="border-primary/40 bg-primary/5">
            <BellRing className="text-primary" />
            <AlertTitle>Report sent</AlertTitle>
            <AlertDescription>
              Nearby vets and volunteers have been alerted. Stay nearby if it&apos;s safe, and post updates here.
            </AlertDescription>
          </Alert>
        )}
        {sp.donation === "cancelled" && (
          <Alert>
            <AlertTitle>Donation cancelled</AlertTitle>
            <AlertDescription>No payment was taken. You can try again anytime.</AlertDescription>
          </Alert>
        )}
        {c.isHidden && (
          <Alert variant="destructive">
            <AlertTitle>Hidden by moderators</AlertTitle>
            <AlertDescription>This case is not visible to the public.</AlertDescription>
          </Alert>
        )}

        {hero && (
          <div className="space-y-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <Image src={hero.url} alt={c.title} fill priority sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" />
            </div>
            {rest.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {rest.map((img) => (
                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {!resolved && <SeverityBadge severity={c.severity} />}
            <StatusBadge status={c.status} />
            {c.outcome && <OutcomeBadge outcome={c.outcome as Outcome} />}
            <Badge variant="outline">{titleCase(c.species)}</Badge>
            {c.verifiedAt && <Badge variant="outline">Verified on site</Badge>}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{c.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-4" /> Reported by{" "}
              <Link href={`/profile/${c.reporter.id}`} className="font-medium text-foreground hover:underline">
                {c.reporter.name}
              </Link>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" /> {timeAgo(c.createdAt)}
            </span>
            {(c.addressText || c.city) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" /> {[c.addressText, c.city].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </header>

        {resolved && c.outcome && (
          <Card className="border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Outcome: <OutcomeBadge outcome={c.outcome as Outcome} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{c.outcomeNote}</p>
              {c.resolvedAt && <p className="mt-2 text-xs text-muted-foreground">Closed {timeAgo(c.resolvedAt)}</p>}
            </CardContent>
          </Card>
        )}

        <section className="space-y-2">
          <p className="whitespace-pre-line leading-relaxed">{c.description}</p>
          {c.injuryTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {c.injuryTags.map((t) => (
                <Badge key={t} variant="secondary">
                  {titleCase(t)}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <CasesMap
          cases={[{ id: c.id, title: c.title, lat: c.lat, lng: c.lng, severity: c.severity, status: c.status, imageUrl: null }]}
          center={{ lat: c.lat, lng: c.lng }}
          height={240}
        />
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
          target="_blank"
          rel="noreferrer"
          className="-mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <MapPin className="size-4" /> Get directions
        </a>

        <section id="timeline" className="space-y-4">
          <h2 className="text-lg font-semibold">Timeline</h2>
          {ctx.canPostUpdate && <UpdateForm caseId={c.id} />}
          <CaseTimeline updates={c.updates} />
        </section>

        <section id="treatment" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Treatment</h2>
            {ctx.canFileTreatment && (
              <Button asChild size="sm">
                <Link href={`/cases/${c.id}/treatment`}>
                  <Stethoscope /> File treatment report
                </Link>
              </Button>
            )}
          </div>
          {c.treatments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No treatment reports yet.</p>
          ) : (
            c.treatments.map((t) => <TreatmentReportCard key={t.report.id} t={t} />)
          )}
        </section>

        {(tags.length > 0 || !resolved) && <TreatmentSuggestions summary={suggestions} species={c.species} />}

        <section id="funds" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Where the money goes</h2>
            {ctx.canAddExpense && <ExpenseDialog caseId={c.id} />}
          </div>
          <FinanceLedger c={c} />
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <ResponderPanel
          caseId={c.id}
          resolved={resolved}
          verified={!!c.verifiedAt}
          signedIn={!!user}
          isReporter={ctx.isReporter}
          viewerRole={user?.role ?? null}
          viewerIsVerifiedVet={user?.isVerifiedVet ?? false}
          myStatus={ctx.mine?.status ?? null}
          myRole={ctx.mine?.role === "vet" ? "vet" : ctx.mine ? "volunteer" : null}
          volunteers={c.activeVolunteers.length}
          maxVolunteers={c.maxVolunteers}
          vets={c.activeVets.length}
          maxVets={c.maxVets}
        />

        {!resolved && (ctx.isParticipant || ctx.escalationUnlocked) && (
          <EmergencyPanel
            caseId={c.id}
            canEscalate={ctx.canEscalate}
            unlocked={ctx.escalationUnlocked}
            minutesUntil={ctx.minutesUntilEscalation}
            escalationMinutes={ESCALATION_MINUTES}
            initialContacts={emergencyContacts}
            escalationCount={c.escalations.length}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Fund this rescue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FundingSummary c={c} />
            {!resolved || c.raisedCents < c.spentCents ? (
              <DonateForm caseId={c.id} defaultName={user?.name} compact />
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href="/donate">Support the general fund</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {(c.activeVolunteers.length > 0 || c.activeVets.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>On this case</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[...c.activeVets, ...c.activeVolunteers].map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <Link href={`/profile/${r.userId}`} className="font-medium hover:underline">
                        {r.name}
                      </Link>
                      <div className="text-xs text-muted-foreground capitalize">
                        {r.role} · {r.status === "checked_in" ? "on site" : "on the way"}
                      </div>
                    </div>
                    {showPhones && r.phone && r.userId !== user?.id && (
                      <Button asChild size="icon-sm" variant="outline" aria-label={`Call ${r.name}`}>
                        <a href={`tel:${r.phone.replace(/\s+/g, "")}`}>
                          <Phone />
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {ctx.canResolve && <ResolveDialog caseId={c.id} />}
        {user && !ctx.isReporter && (
          <div className="flex justify-center">
            <FlagDialog caseId={c.id} />
          </div>
        )}
      </aside>
    </div>
  );
}

function CaseSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Skeleton className="aspect-[16/10] w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function CasePage(props: PageProps<"/cases/[id]">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <Suspense fallback={<CaseSkeleton />}>
        <CaseView params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

import { Medal, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StoryFrame } from "@/components/media/story-frame";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PHOTOS } from "@/lib/photos";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { initials, titleCase } from "@/lib/format";
import { getLeaderboard, getLeaderboardCities } from "@/lib/queries/users";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboard" };

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function href(period: string, city?: string) {
  const q = new URLSearchParams({ period });
  if (city) q.set("city", city);
  return `/leaderboard?${q}`;
}

async function Board({ searchParams }: { searchParams: PageProps<"/leaderboard">["searchParams"] }) {
  const sp = await searchParams;
  const period = one(sp.period) === "month" ? "month" : "all";
  const city = one(sp.city);
  const [rows, cities] = await Promise.all([
    getLeaderboard({ period, city, limit: 50 }),
    getLeaderboardCities(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All time"],
            ["month", "This month"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={href(value, city)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              period === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={href(period)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            !city ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted",
          )}
        >
          All cities
        </Link>
        {cities.map((c) => (
          <Link
            key={c.city}
            href={href(period, c.city)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              city === c.city ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted",
            )}
          >
            {c.city}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No points recorded for this view yet.
        </p>
      ) : (
        <ol className="divide-y rounded-xl border">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/profile/${r.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                <span
                  className={cn(
                    "w-8 text-center text-sm font-semibold",
                    r.rank === 1 && "text-amber-500",
                    r.rank === 2 && "text-zinc-400",
                    r.rank === 3 && "text-orange-700",
                  )}
                >
                  {r.rank <= 3 ? <Medal className="mx-auto size-5" /> : r.rank}
                </span>
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials(r.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {titleCase(r.role)} · {r.city}
                    {r.badgeCount > 0 && ` · ${r.badgeCount} badge${r.badgeCount === 1 ? "" : "s"}`}
                  </p>
                </div>
                <Badge variant="secondary">{r.points.toLocaleString()} pts</Badge>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function LeaderboardPage(props: PageProps<"/leaderboard">) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div className="grid items-center gap-5 sm:grid-cols-[148px_minmax(0,1fr)]">
        <StoryFrame photo={PHOTOS.elephantCalf} className="aspect-[4/3] rounded-2xl" sizes="160px" />
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
            <Trophy className="size-4" /> The people who show up
          </p>
          <h1 className="text-3xl font-medium">Leaderboard</h1>
          <p className="text-muted-foreground">
            Points for reporting, showing up, treating, and resolving cases. Ties share the higher rank.
          </p>
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <Board searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

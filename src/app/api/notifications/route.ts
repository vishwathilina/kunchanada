import { and, count, desc, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { caseResponders, notifications } from "@/db/schema";
import { getCurrentUser, getSession } from "@/lib/auth";
import { notificationHref } from "@/lib/notification-href";
import { markNotificationsRead } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 10) || 10));
  const [items, [unread], mine] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
    db
      .select({ caseId: caseResponders.caseId, status: caseResponders.status })
      .from(caseResponders)
      .where(eq(caseResponders.userId, user.id)),
  ]);

  const responseFor = (caseId: string | null) => {
    if (!caseId) return null;
    const row = mine.find((r) => r.caseId === caseId);
    if (!row) return null;
    return row.status === "left" ? "declined" : "accepted";
  };

  return NextResponse.json(
    {
      unread: unread?.value ?? 0,
      viewer: { id: user.id, role: user.role, verified: user.isVerifiedVet },
      items: items.map((n) => ({
        ...n,
        href: notificationHref(n, user.role),
        response: n.type === "new_case_nearby" ? responseFor(n.caseId) : null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : undefined;
  await markNotificationsRead(db, session.sub, ids);
  return NextResponse.json({ ok: true });
}

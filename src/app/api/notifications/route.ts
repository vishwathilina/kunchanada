import { and, count, desc, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { notificationHref } from "@/lib/notification-href";
import { markNotificationsRead } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 10) || 10));
  const [items, [unread]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.sub))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, session.sub), isNull(notifications.readAt))),
  ]);

  return NextResponse.json(
    { unread: unread?.value ?? 0, items: items.map((n) => ({ ...n, href: notificationHref(n, session.role) })) },
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

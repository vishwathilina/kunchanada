import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

const PROTECTED_PREFIXES = ["/dashboard", "/notifications", "/admin", "/cases/new"];
const AUTH_PAGES = ["/login", "/register"];

function isProtected(pathname: string) {
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return /^\/cases\/[^/]+\/treatment\/?$/.test(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (AUTH_PAGES.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtected(pathname)) {
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname + search);
      const res = NextResponse.redirect(login);
      if (request.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    if (pathname.startsWith("/admin") && session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/notifications/:path*", "/admin/:path*", "/cases/:path*", "/login", "/register"],
};

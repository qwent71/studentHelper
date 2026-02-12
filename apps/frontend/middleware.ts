import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getBackendUrl } from "./lib/env";

const AUTH_COOKIE_SUFFIX = "sh.session_token";

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return false;

  try {
    const response = await fetch(new URL("/api/auth/get-session", getBackendUrl()), {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { user?: unknown } | null;
    return Boolean(data?.user);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/auth");
  const isProtectedPage =
    pathname.startsWith("/app") || pathname.startsWith("/admin");
  const hasSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.endsWith(AUTH_COOKIE_SUFFIX));

  if (!isAuthPage && !isProtectedPage) {
    return NextResponse.next();
  }

  const isAuthenticated = hasSessionCookie && (await hasValidSession(request));

  // Authenticated users visiting auth pages → redirect to /app
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // Unauthenticated users visiting protected pages → redirect to login
  if (!isAuthenticated && isProtectedPage) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

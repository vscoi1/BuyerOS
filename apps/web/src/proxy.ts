import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/overview",
  "/clients",
  "/properties",
  "/off-market",
  "/intelligence",
  "/analysis",
  "/compliance",
  "/activity",
];

const authRate = new Map<string, { count: number; resetAt: number }>();
const apiRate = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const current = map.get(key);

  if (!current || now > current.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  map.set(key, current);

  return current.count > limit;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const demoUser = request.headers.get("x-demo-user");
  const ip = request.headers.get("x-forwarded-for") ?? "local";

  if (pathname.startsWith("/api/auth")) {
    if (isRateLimited(authRate, ip, 5, 15 * 60 * 1000)) {
      return new NextResponse("Too many auth requests", { status: 429 });
    }
  }

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/health")) {
    if (isRateLimited(apiRate, ip, 120, 15 * 60 * 1000)) {
      return new NextResponse("Too many API requests", { status: 429 });
    }
  }

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) && demoUser === "anonymous") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; object-src 'none'");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

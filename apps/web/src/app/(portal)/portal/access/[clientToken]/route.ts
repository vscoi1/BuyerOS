import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  issuePortalSessionForClient,
  resolvePortalSession,
} from "@/server/data/data-access";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/portal/access/[clientToken]">,
) {
  const { clientToken } = await context.params;
  const requestUrl = new URL(request.url);
  const resolved = await resolvePortalSession(clientToken);

  if (!resolved) {
    return NextResponse.redirect(new URL("/portal/login?error=invalid", requestUrl));
  }

  const issued = await issuePortalSessionForClient(resolved, {
    oneTime: false,
    rotateExisting: false,
    ttlHours: 24 * 7,
  });

  const response = NextResponse.redirect(new URL("/portal", requestUrl));
  response.cookies.set(env.portalSessionCookieName, issued.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: env.sessionMaxAgeSeconds,
  });

  return response;
}

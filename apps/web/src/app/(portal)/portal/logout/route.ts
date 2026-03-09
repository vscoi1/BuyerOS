import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/portal/login", request.url));
  response.cookies.delete(env.portalSessionCookieName);
  return response;
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import {
  issuePortalSessionForClient,
  resolvePortalSession,
} from "@/server/data/data-access";

function setPortalSessionCookie(token: string): Promise<void> {
  return cookies().then((cookieStore) => {
    cookieStore.set(env.portalSessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.isProduction,
      path: "/",
      maxAge: env.sessionMaxAgeSeconds,
    });
  });
}

export async function portalLoginWithToken(token: string): Promise<void> {
  const normalized = token.trim();
  if (!normalized) {
    redirect("/portal/login?error=missing");
  }

  const resolved = await resolvePortalSession(normalized);
  if (!resolved) {
    redirect("/portal/login?error=invalid");
  }

  const issued = await issuePortalSessionForClient(resolved, {
    rotateExisting: false,
    oneTime: false,
    ttlHours: 24 * 7,
  });

  await setPortalSessionCookie(issued.token);
  redirect("/portal");
}

export async function portalLoginAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  return portalLoginWithToken(token);
}

export async function portalLogoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(env.portalSessionCookieName);
  redirect("/portal/login");
}

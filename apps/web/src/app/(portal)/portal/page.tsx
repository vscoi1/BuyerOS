import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { resolvePortalSession } from "@/server/data/data-access";
import { PortalWorkbench } from "@/components/dashboard/PortalWorkbench";

export default async function ClientPortalHomePage() {
  const cookieStore = await cookies();
  const portalToken = cookieStore.get(env.portalSessionCookieName)?.value;

  if (!portalToken) {
    redirect("/portal/login");
  }

  const resolved = await resolvePortalSession(portalToken);
  if (!resolved) {
    redirect("/portal/login?error=invalid");
  }

  return <PortalWorkbench />;
}

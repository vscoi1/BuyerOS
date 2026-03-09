import { notFound } from "next/navigation";
import { PortalWorkbench } from "@/components/dashboard/PortalWorkbench";
import { resolvePortalSession } from "@/server/data/data-access";

interface ClientPortalPageProps {
  params: Promise<{
    agentSlug: string;
    clientToken: string;
  }>;
}

export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  const { agentSlug, clientToken } = await params;

  // Enforce session integrity on every request — returns null if expired or revoked
  const resolved = await resolvePortalSession(clientToken);
  if (!resolved) {
    notFound(); // Returns a 404 for expired / revoked / invalid tokens
  }

  return <PortalWorkbench agentSlug={agentSlug} clientToken={clientToken} />;
}

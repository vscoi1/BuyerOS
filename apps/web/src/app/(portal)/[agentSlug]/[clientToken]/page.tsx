import { PortalWorkbench } from "@/components/dashboard/PortalWorkbench";

interface ClientPortalPageProps {
  params: Promise<{
    agentSlug: string;
    clientToken: string;
  }>;
}

export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  const { agentSlug, clientToken } = await params;
  return <PortalWorkbench agentSlug={agentSlug} clientToken={clientToken} />;
}

import { PageHeader } from "@/components/layout/PageHeader";
import { OverviewLive } from "@/components/dashboard/OverviewLive";
import { auth } from "@/lib/auth";
import {
  listClients,
  listOffMarketSubmissions,
  listProperties,
} from "@/server/data/data-access";
import { redirect } from "next/navigation";

export default async function OverviewPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [clients, properties, submissions] = await Promise.all([
    listClients(session),
    listProperties(session, {}),
    listOffMarketSubmissions(session),
  ]);

  const initialStats = {
    clientCount: clients.length,
    propertyCount: properties.length,
    dueDiligenceCount: properties.filter((property) => property.stage === "DUE_DILIGENCE").length,
    offMarketCount: submissions.length,
  };

  const initialProperties = properties.map((property) => ({
    id: property.id,
    address: property.address,
    suburb: property.suburb,
    state: property.state,
    stage: property.stage,
    matchScore: property.matchScore ?? 0,
    isOffMarket: property.isOffMarket,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Operational snapshot for NSW + VIC buying activity"
        actionLabel="New Client"
      />
      <OverviewLive initialStats={initialStats} initialProperties={initialProperties} />
    </div>
  );
}

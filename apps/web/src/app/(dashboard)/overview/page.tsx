import { PageHeader } from "@/components/layout/PageHeader";
import { OverviewLive } from "@/components/dashboard/OverviewLive";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Operational snapshot for NSW + VIC buying activity"
        actionLabel="New Client"
      />
      <OverviewLive />
    </div>
  );
}

import { PageHeader } from "@/components/layout/PageHeader";
import { OffMarketWorkbench } from "@/components/dashboard/OffMarketWorkbench";

export default function OffMarketPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Off-Market Inbox" subtitle="Submit, route, and assign silent listings" />
      <OffMarketWorkbench />
    </div>
  );
}

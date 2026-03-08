import { PageHeader } from "@/components/layout/PageHeader";
import { StampDutyWorkbench } from "@/components/dashboard/StampDutyWorkbench";

export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analysis"
        subtitle="Stamp-duty and entry-cost intelligence"
      />
      <StampDutyWorkbench />
    </div>
  );
}

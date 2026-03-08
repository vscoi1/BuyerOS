import { ComplianceWorkbench } from "@/components/dashboard/ComplianceWorkbench";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" subtitle="NSW + VIC checklist templates and evidence readiness" />
      <ComplianceWorkbench />
    </div>
  );
}

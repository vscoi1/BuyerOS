import { PageHeader } from "@/components/layout/PageHeader";
import { PropertyWorkbench } from "@/components/dashboard/PropertyWorkbench";

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Properties" subtitle="Live property operations, scoring, due diligence, and documents" />
      <PropertyWorkbench />
    </div>
  );
}

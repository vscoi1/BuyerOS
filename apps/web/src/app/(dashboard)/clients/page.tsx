import { PageHeader } from "@/components/layout/PageHeader";
import { ClientWorkbench } from "@/components/dashboard/ClientWorkbench";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Clients" subtitle="Create, update, and manage portal workflows" />
      <ClientWorkbench />
    </div>
  );
}

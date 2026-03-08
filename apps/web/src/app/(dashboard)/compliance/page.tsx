import { PageHeader } from "@/components/layout/PageHeader";
import { getChecklistForState } from "@/server/services/compliance";

export default function CompliancePage() {
  const nsw = getChecklistForState("NSW");
  const vic = getChecklistForState("VIC");

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" subtitle="NSW + VIC checklist templates and evidence readiness" />
      <section className="grid gap-4 lg:grid-cols-2">
        {[nsw, vic].map((checklist) => (
          <article key={checklist.state} className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
            <h2 className="text-lg font-semibold">{checklist.state} checklist</h2>
            <p className="text-sm text-[var(--color-neutral-500)]">Policy version {checklist.policyVersion}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--color-neutral-700)]">
              {checklist.items.map((item) => (
                <li key={item.code}>{item.label}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

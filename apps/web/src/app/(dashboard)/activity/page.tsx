import { PageHeader } from "@/components/layout/PageHeader";
import { listAuditLogs } from "@/server/audit";
import { listEvents } from "@/server/events";

export default function ActivityPage() {
  const events = listEvents();
  const auditLogs = listAuditLogs();

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" subtitle="Immutable event stream for workflow and AI actions" />
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold">Domain Events</h2>
          <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
            Workflow and AI events emitted by core modules.
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {events.length ? (
              events.map((event) => (
                <li key={event.id} className="rounded-[var(--radius-md)] border border-[var(--color-neutral-100)] p-3">
                  <p className="font-medium">{event.type}</p>
                  <p className="text-[var(--color-neutral-500)]">
                    {new Date(event.createdAt).toLocaleString("en-AU")}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-[var(--color-neutral-500)]">
                No events yet. API actions will populate this feed.
              </li>
            )}
          </ul>
        </article>

        <article className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold">Audit Trail</h2>
          <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
            Sensitive actions with actor and entity references.
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {auditLogs.length ? (
              auditLogs.map((log) => (
                <li key={log.id} className="rounded-[var(--radius-md)] border border-[var(--color-neutral-100)] p-3">
                  <p className="font-medium">{log.action}</p>
                  <p className="text-[var(--color-neutral-500)]">
                    {new Date(log.createdAt).toLocaleString("en-AU")}
                  </p>
                  <p className="text-[var(--color-neutral-500)]">
                    Actor: {log.actorId} · {log.entityType}: {log.entityId}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-[var(--color-neutral-500)]">
                No audit logs yet. Mutations will append entries automatically.
              </li>
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}

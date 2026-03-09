"use server";

import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";
import { listAuditLogs } from "@/server/audit";
import { listEvents } from "@/server/events";
import { redirect } from "next/navigation";

export default async function ActivityPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [auditPage, domainEvents] = await Promise.all([
    listAuditLogs(session.organizationId, 50),
    Promise.resolve(listEvents(session.organizationId, 50)),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        subtitle="Immutable event stream for workflow and AI actions"
      />

      <section className="grid gap-4 xl:grid-cols-2">
        {/* ── Domain Events ── */}
        <article className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold">Domain Events</h2>
          <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
            Workflow and AI events emitted by core modules.
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {domainEvents.length ? (
              domainEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-neutral-100)] p-3"
                >
                  <p className="font-medium">{event.type}</p>
                  <p className="text-[var(--color-neutral-500)]">
                    {new Date(event.createdAt).toLocaleString("en-AU")}
                  </p>
                  {"payload" in event && Object.keys(event.payload).length > 0 && (
                    <p className="mt-1 truncate text-xs text-[var(--color-neutral-400)]">
                      {Object.entries(event.payload)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(" · ")}
                    </p>
                  )}
                </li>
              ))
            ) : (
              <li className="text-[var(--color-neutral-500)]">
                No events yet. API actions will populate this feed.
              </li>
            )}
          </ul>
        </article>

        {/* ── Audit Trail ── */}
        <article className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Audit Trail</h2>
              <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
                Sensitive mutations with actor and entity references.
              </p>
            </div>
            {auditPage.nextCursor && (
              <span className="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs text-[var(--color-neutral-500)]">
                Showing first 50
              </span>
            )}
          </div>
          <ul className="mt-3 space-y-3 text-sm">
            {auditPage.items.length ? (
              auditPage.items.map((log) => (
                <li
                  key={log.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-neutral-100)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{log.action}</p>
                    <span className="shrink-0 rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-mono text-[var(--color-neutral-500)]">
                      {log.entityType}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-neutral-400)]">
                    {new Date(log.createdAt).toLocaleString("en-AU")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                    Actor: <span className="font-mono">{log.actorId}</span>
                    {" · "}
                    Entity: <span className="font-mono">{log.entityId}</span>
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

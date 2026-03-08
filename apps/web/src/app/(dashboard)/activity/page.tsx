import { PageHeader } from "@/components/layout/PageHeader";
import { listEvents } from "@/server/events";

export default function ActivityPage() {
  const events = listEvents();

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" subtitle="Immutable event stream for workflow and AI actions" />
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
        <ul className="space-y-3 text-sm">
          {events.length ? (
            events.map((event) => (
              <li key={event.id} className="rounded-[var(--radius-md)] border border-[var(--color-neutral-100)] p-3">
                <p className="font-medium">{event.type}</p>
                <p className="text-[var(--color-neutral-500)]">{new Date(event.createdAt).toLocaleString("en-AU")}</p>
              </li>
            ))
          ) : (
            <li className="text-[var(--color-neutral-500)]">No events yet. API actions will populate this feed.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

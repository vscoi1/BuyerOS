"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface PortalWorkbenchProps {
  agentSlug: string;
  clientToken: string;
}

export function PortalWorkbench({ agentSlug, clientToken }: PortalWorkbenchProps) {
  const clientsQuery = trpc.clients.list.useQuery();
  const defaultClientId = clientsQuery.data?.[0]?.id ?? "client_demo_1";
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId);

  const shortlistQuery = trpc.portal.shortlist.list.useQuery(
    { clientId: selectedClientId || defaultClientId },
    { enabled: Boolean(selectedClientId || defaultClientId) },
  );

  const milestonesQuery = trpc.portal.milestones.list.useQuery(
    { clientId: selectedClientId || defaultClientId },
    { enabled: Boolean(selectedClientId || defaultClientId) },
  );

  const feedbackMutation = trpc.portal.feedback.submit.useMutation();

  const firstPropertyId = useMemo(
    () => shortlistQuery.data?.[0]?.id ?? "",
    [shortlistQuery.data],
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
        <p className="text-sm text-[var(--color-neutral-500)]">Client portal powered by BuyerOS</p>
        <h1 className="mt-1 text-2xl font-semibold">{agentSlug} Portfolio Tracker</h1>
        <p className="mt-2 text-xs text-[var(--color-neutral-500)]">Session token: {clientToken}</p>
        <select
          value={selectedClientId || defaultClientId}
          onChange={(event) => setSelectedClientId(event.target.value)}
          className="mt-3 rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
        >
          {(clientsQuery.data ?? []).map((client) => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName}
            </option>
          ))}
        </select>
      </header>

      <section className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="text-lg font-semibold">Current Milestones</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--color-neutral-700)]">
          {(milestonesQuery.data ?? []).map((milestone) => (
            <li key={milestone.propertyId}>
              {milestone.address} - {milestone.stage}
            </li>
          ))}
          {!milestonesQuery.data?.length ? <li>No milestones available.</li> : null}
        </ul>
      </section>

      <section className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="text-lg font-semibold">Shortlist Feedback</h2>
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            feedbackMutation.mutate({
              clientId: selectedClientId || defaultClientId,
              propertyId: String(form.get("propertyId")),
              status: String(form.get("status")) as "INTERESTED" | "NOT_INTERESTED" | "REQUEST_INFO",
              comment: String(form.get("comment")) || undefined,
            });
            event.currentTarget.reset();
          }}
        >
          <select name="propertyId" defaultValue={firstPropertyId} className="w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required>
            {(shortlistQuery.data ?? []).map((property) => (
              <option key={property.id} value={property.id}>
                {property.address}
              </option>
            ))}
          </select>
          <select name="status" defaultValue="INTERESTED" className="w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm">
            <option value="INTERESTED">Interested</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="REQUEST_INFO">Request Info</option>
          </select>
          <input name="comment" placeholder="Comment" className="w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" />
          <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white" disabled={feedbackMutation.isPending || !firstPropertyId}>
            {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </section>
    </main>
  );
}

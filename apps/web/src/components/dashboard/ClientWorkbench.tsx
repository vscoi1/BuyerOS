"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";

function formatBudget(min: number, max: number): string {
  const format = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
  return `${format.format(min)} - ${format.format(max)}`;
}

export function ClientWorkbench() {
  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery();
  const propertiesQuery = trpc.property.list.useQuery({});
  const [selectedClientId, setSelectedClientId] = useState<string>("client_demo_1");

  const selectedClientQuery = trpc.clients.get.useQuery(
    { id: selectedClientId },
    { enabled: Boolean(selectedClientId) },
  );

  const milestonesQuery = trpc.portal.milestones.list.useQuery(
    { clientId: selectedClientId },
    { enabled: Boolean(selectedClientId) },
  );

  const shortlistQuery = trpc.portal.shortlist.list.useQuery(
    { clientId: selectedClientId },
    { enabled: Boolean(selectedClientId) },
  );

  const createClient = trpc.clients.create.useMutation({
    onSuccess: async () => {
      await utils.clients.list.invalidate();
    },
  });

  const updateClient = trpc.clients.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.clients.list.invalidate(),
        utils.clients.get.invalidate({ id: selectedClientId }),
      ]);
    },
  });

  const createPortalSession = trpc.portal.session.create.useMutation();

  const submitFeedback = trpc.portal.feedback.submit.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.portal.milestones.list.invalidate({ clientId: selectedClientId }),
        utils.portal.shortlist.list.invalidate({ clientId: selectedClientId }),
      ]);
    },
  });

  const propertyForFeedback = useMemo(() => {
    return propertiesQuery.data?.find((property) => property.clientId === selectedClientId)?.id ?? "";
  }, [propertiesQuery.data, selectedClientId]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            createClient.mutate({
              firstName: String(form.get("firstName")),
              lastName: String(form.get("lastName")),
              email: String(form.get("email")),
              budgetMin: Number(form.get("budgetMin")),
              budgetMax: Number(form.get("budgetMax")),
              targetSuburbs: String(form.get("targetSuburbs"))
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
              briefSummary: String(form.get("briefSummary")),
            });
            event.currentTarget.reset();
          }}
          className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
        >
          <h2 className="text-lg font-semibold">Create Client</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input name="firstName" placeholder="First name" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
            <input name="lastName" placeholder="Last name" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
            <input name="email" type="email" placeholder="Email" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
            <input name="targetSuburbs" placeholder="Suburbs (comma-separated)" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
            <input name="budgetMin" type="number" placeholder="Budget min" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
            <input name="budgetMax" type="number" placeholder="Budget max" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
          </div>
          <textarea name="briefSummary" placeholder="Brief summary" className="mt-3 min-h-24 w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
          <button
            type="submit"
            className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white"
            disabled={createClient.isPending}
          >
            {createClient.isPending ? "Saving..." : "Create Client"}
          </button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            updateClient.mutate({
              id: selectedClientId,
              briefSummary: String(form.get("briefSummary")),
            });
          }}
          className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
        >
          <h2 className="text-lg font-semibold">Update Selected Client</h2>
          <select
            value={selectedClientId}
            onChange={(event) => setSelectedClientId(event.target.value)}
            className="mt-3 w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
          >
            {(clientsQuery.data ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </select>
          <textarea
            name="briefSummary"
            defaultValue={selectedClientQuery.data?.briefSummary ?? ""}
            className="mt-3 min-h-24 w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-neutral-300)] px-4 py-2 text-sm font-medium"
            disabled={updateClient.isPending || !selectedClientId}
          >
            {updateClient.isPending ? "Updating..." : "Update Brief"}
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold">Client List (Live)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(clientsQuery.data ?? []).map((client) => (
              <li key={client.id} className="rounded border border-[var(--color-neutral-100)] p-3">
                <p className="font-medium">{client.firstName} {client.lastName}</p>
                <p className="text-[var(--color-neutral-500)]">{formatBudget(client.budgetMin, client.budgetMax)}</p>
                <p className="text-[var(--color-neutral-500)]">{client.targetSuburbs.join(", ")}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold">Portal Actions</h2>
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-[var(--radius-md)] border border-[var(--color-neutral-300)] px-3 py-2 text-sm"
              onClick={() => createPortalSession.mutate({ clientId: selectedClientId })}
              disabled={!selectedClientId || createPortalSession.isPending}
            >
              {createPortalSession.isPending ? "Creating..." : "Create Portal Session"}
            </button>
          </div>
          {createPortalSession.data ? (
            <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
              Token: {createPortalSession.data.token} (expires {new Date(createPortalSession.data.expiresAt).toLocaleString("en-AU")})
            </p>
          ) : null}

          <h3 className="mt-4 text-sm font-semibold">Milestones</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {(milestonesQuery.data ?? []).map((milestone) => (
              <li key={milestone.propertyId} className="rounded border border-[var(--color-neutral-100)] p-2">
                {milestone.address} - {milestone.stage}
              </li>
            ))}
            {!milestonesQuery.data?.length ? <li className="text-[var(--color-neutral-500)]">No milestones yet.</li> : null}
          </ul>

          <h3 className="mt-4 text-sm font-semibold">Submit Feedback</h3>
          <form
            className="mt-2 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              submitFeedback.mutate({
                clientId: selectedClientId,
                propertyId: String(form.get("propertyId")),
                status: String(form.get("status")) as "INTERESTED" | "NOT_INTERESTED" | "REQUEST_INFO",
                comment: String(form.get("comment")) || undefined,
              });
              event.currentTarget.reset();
            }}
          >
            <select name="propertyId" defaultValue={propertyForFeedback} className="w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required>
              {(shortlistQuery.data ?? []).map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address}
                </option>
              ))}
            </select>
            <select name="status" className="w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" defaultValue="INTERESTED">
              <option value="INTERESTED">Interested</option>
              <option value="NOT_INTERESTED">Not Interested</option>
              <option value="REQUEST_INFO">Request Info</option>
            </select>
            <input name="comment" placeholder="Comment (optional)" className="w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" />
            <button type="submit" className="rounded-[var(--radius-md)] border border-[var(--color-neutral-300)] px-3 py-2 text-sm" disabled={submitFeedback.isPending || !propertyForFeedback}>
              {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

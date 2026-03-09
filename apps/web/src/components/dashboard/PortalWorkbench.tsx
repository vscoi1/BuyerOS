"use client";

import { useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PortalWorkbench() {
  const meQuery = trpc.portal.client.me.useQuery();
  const shortlistQuery = trpc.portal.client.shortlist.useQuery();
  const milestonesQuery = trpc.portal.client.milestones.useQuery();
  const projectionQuery = trpc.portal.client.portfolio.projection10Y.useQuery();
  const documentsQuery = trpc.portal.client.documents.list.useQuery();

  const feedbackMutation = trpc.portal.client.feedback.useMutation();
  const uploadMutation = trpc.portal.client.documents.upload.useMutation({
    onSuccess: async () => {
      await documentsQuery.refetch();
    },
  });

  const firstPropertyId = useMemo(() => shortlistQuery.data?.[0]?.id ?? "", [shortlistQuery.data]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--color-neutral-500)]">BuyerOS Client Portal</p>
            <h1 className="mt-1 text-2xl font-semibold">
              {meQuery.data ? `${meQuery.data.firstName} ${meQuery.data.lastName}` : "Your property journey"}
            </h1>
            <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
              Track milestones, share documents, and review portfolio projections.
            </p>
          </div>
          <Link
            href="/portal/logout"
            className="rounded-[var(--radius-md)] border border-[var(--color-neutral-300)] px-3 py-2 text-xs font-medium"
          >
            Sign out
          </Link>
        </div>
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
        <h2 className="text-lg font-semibold">Portfolio Projection</h2>
        <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
          Indicative only. Ten-year projection uses assumed annual growth and is not financial advice.
        </p>
        <div className="mt-3 space-y-3 text-sm">
          {(projectionQuery.data ?? []).map((projection) => (
            <article key={projection.propertyId} className="rounded border border-[var(--color-neutral-100)] p-3">
              <p className="font-medium">{projection.address}, {projection.suburb} {projection.state}</p>
              <p className="text-[var(--color-neutral-600)]">
                Current estimate: {formatCurrency(projection.currentValue)}
              </p>
              <p className="text-[var(--color-neutral-600)]">
                10-year projection: {formatCurrency(projection.projectedValue10Y)} ({projection.assumedAnnualGrowthPct.toFixed(1)}% p.a.)
              </p>
            </article>
          ))}
          {!projectionQuery.data?.length ? (
            <p className="text-[var(--color-neutral-500)]">No projection data available yet.</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold">Share a Document</h2>
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
            Upload details so your buyer&apos;s agent can review associated documents.
          </p>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              uploadMutation.mutate({
                propertyId: String(form.get("propertyId")),
                fileName: String(form.get("fileName")),
                mimeType: "application/pdf",
                sizeBytes: 1024 * 100,
              });
              event.currentTarget.reset();
            }}
          >
            <select
              name="propertyId"
              defaultValue={firstPropertyId}
              className="w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
              required
            >
              {(shortlistQuery.data ?? []).map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address}
                </option>
              ))}
            </select>
            <input
              name="fileName"
              placeholder="Document name (e.g. Finance pre-approval.pdf)"
              className="w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white"
              disabled={uploadMutation.isPending || !firstPropertyId}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
            </button>
          </form>

          <h3 className="mt-4 text-sm font-semibold">Uploaded Documents</h3>
          <ul className="mt-2 space-y-2 text-xs text-[var(--color-neutral-600)]">
            {(documentsQuery.data ?? []).map((doc) => (
              <li key={doc.id} className="rounded border border-[var(--color-neutral-100)] px-2 py-1.5">
                {doc.fileName} · {doc.status}
              </li>
            ))}
            {!documentsQuery.data?.length ? <li>No documents uploaded yet.</li> : null}
          </ul>
        </article>

        <article className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold">Shortlist Feedback</h2>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              feedbackMutation.mutate({
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
        </article>
      </section>
    </main>
  );
}

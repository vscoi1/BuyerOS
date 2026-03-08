"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

export function OffMarketWorkbench() {
  const utils = trpc.useUtils();
  const submissionsQuery = trpc.offMarket.list.useQuery();
  const [selectedSubmission, setSelectedSubmission] = useState<string>("off_market_demo_1");

  const submitListing = trpc.offMarket.submit.useMutation({
    onSuccess: async () => {
      await utils.offMarket.list.invalidate();
    },
  });

  const assignSubmission = trpc.offMarket.assign.useMutation({
    onSuccess: async () => {
      await utils.offMarket.list.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <form
          className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            submitListing.mutate({
              sellingAgent: String(form.get("sellingAgent")),
              agency: String(form.get("agency")),
              address: String(form.get("address")),
              suburb: String(form.get("suburb")),
              state: String(form.get("state")) as "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT",
              postcode: String(form.get("postcode")),
              askPrice: Number(form.get("askPrice")) || undefined,
            });
            event.currentTarget.reset();
          }}
        >
          <h2 className="text-lg font-semibold">Submit Off-Market Listing</h2>
          <div className="mt-3 grid gap-2">
            <input name="sellingAgent" placeholder="Selling agent" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
            <input name="agency" placeholder="Agency" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
            <input name="address" placeholder="Address" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
            <div className="grid gap-2 md:grid-cols-3">
              <input name="suburb" placeholder="Suburb" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
              <select name="state" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" defaultValue="VIC">
                {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
              <input name="postcode" placeholder="Postcode" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
            </div>
            <input name="askPrice" type="number" placeholder="Ask price" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" />
          </div>
          <button type="submit" className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white" disabled={submitListing.isPending}>
            {submitListing.isPending ? "Submitting..." : "Submit Listing"}
          </button>
        </form>

        <form
          className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            assignSubmission.mutate({
              submissionId: selectedSubmission,
              agentId: String(form.get("agentId")),
            });
          }}
        >
          <h2 className="text-lg font-semibold">Assign Submission</h2>
          <select
            value={selectedSubmission}
            onChange={(event) => setSelectedSubmission(event.target.value)}
            className="mt-3 w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm"
          >
            {(submissionsQuery.data ?? []).map((submission) => (
              <option key={submission.id} value={submission.id}>
                {submission.suburb}, {submission.state} ({submission.status})
              </option>
            ))}
          </select>
          <input name="agentId" defaultValue="agent_demo_1" className="mt-2 w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
          <button type="submit" className="mt-3 rounded border border-[var(--color-neutral-300)] px-4 py-2 text-sm" disabled={assignSubmission.isPending || !selectedSubmission}>
            {assignSubmission.isPending ? "Assigning..." : "Assign"}
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(submissionsQuery.data ?? []).map((listing) => (
          <article key={listing.id} className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
            <p className="text-sm text-[var(--color-neutral-500)]">{listing.sellingAgent} - {listing.agency}</p>
            <h2 className="mt-1 text-lg font-semibold">{listing.address}</h2>
            <p className="text-sm">{listing.suburb}, {listing.state} {listing.postcode}</p>
            <p className="mt-2 text-sm">Status: <span className="font-medium">{listing.status}</span></p>
            {listing.assignedAgentId ? <p className="text-xs text-[var(--color-neutral-500)]">Assigned to: {listing.assignedAgentId}</p> : null}
          </article>
        ))}
      </section>
    </div>
  );
}

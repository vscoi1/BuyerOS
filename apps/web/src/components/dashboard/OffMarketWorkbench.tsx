"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";

export function OffMarketWorkbench() {
  const searchParams = useSearchParams();
  const requestedSubmissionId = searchParams.get("submissionId");
  const utils = trpc.useUtils();
  const submissionsQuery = trpc.offMarket.list.useQuery();
  const agentsQuery = trpc.offMarket.listAgents.useQuery();

  const [manualSelectedSubmission, setManualSelectedSubmission] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const selectedSubmissionId = useMemo(() => {
    const submissions = submissionsQuery.data ?? [];
    if (submissions.length === 0) return "";
    if (requestedSubmissionId && submissions.some((s) => s.id === requestedSubmissionId)) return requestedSubmissionId;
    if (manualSelectedSubmission && submissions.some((s) => s.id === manualSelectedSubmission)) return manualSelectedSubmission;
    return submissions[0]?.id ?? "";
  }, [manualSelectedSubmission, requestedSubmissionId, submissionsQuery.data]);

  const selectedSubmission = useMemo(() =>
    (submissionsQuery.data ?? []).find(s => s.id === selectedSubmissionId),
    [selectedSubmissionId, submissionsQuery.data]
  );

  const recommendationsQuery = trpc.offMarket.recommendAgents.useQuery(
    { submissionId: selectedSubmissionId },
    { enabled: !!selectedSubmissionId }
  );

  const submitListing = trpc.offMarket.submit.useMutation({
    onSuccess: () => utils.offMarket.list.invalidate(),
  });

  const assignSubmission = trpc.offMarket.assign.useMutation({
    onSuccess: () => {
      utils.offMarket.list.invalidate();
      setSelectedAgentId("");
    },
  });

  const [now] = useState(() => Date.now());

  const formatSLA = (createdAt: string, assignedAt?: string) => {
    const start = new Date(createdAt).getTime();
    const end = assignedAt ? new Date(assignedAt).getTime() : now;
    const diffMins = Math.round((end - start) / 60000);

    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.round(diffHours / 24)}d`;
  };

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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Submit Off-Market</h2>
            <span className="rounded-full bg-[var(--color-brand-50)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-600)]">Admin Only</span>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input name="sellingAgent" placeholder="Selling Agent Name" className="rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]" required />
              <input name="agency" placeholder="Agency Name" className="rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]" required />
            </div>
            <input name="address" placeholder="Property Street Address" className="rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]" required />
            <div className="grid gap-3 md:grid-cols-3">
              <input name="suburb" placeholder="Suburb" className="rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]" required />
              <select name="state" className="rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]" defaultValue="NSW">
                {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input name="postcode" placeholder="Postcode" className="rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]" required />
            </div>
            <input name="askPrice" type="number" placeholder="Expected Price (Optional)" className="rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]" />
          </div>
          <button type="submit" className="mt-5 w-full rounded-md bg-[var(--color-brand-600)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" disabled={submitListing.isPending}>
            {submitListing.isPending ? "Processing..." : "Register Submission"}
          </button>
        </form>

        <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Assignment & Routing</h2>
          <p className="mt-1 text-sm text-[var(--color-neutral-500)]">Match silent listings to the best-suited buyer&apos;s agent.</p>

          <div className="mt-4 flex-1 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-neutral-500)]">Select Submission</label>
              <select
                value={selectedSubmissionId}
                onChange={(e) => setManualSelectedSubmission(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]"
              >
                {(submissionsQuery.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.suburb} - {s.sellingAgent} ({s.status})</option>
                ))}
                {(submissionsQuery.data ?? []).length === 0 && <option value="">No active submissions</option>}
              </select>
            </div>

            <div className="rounded-md bg-[var(--color-neutral-50)] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-neutral-600)]">AI Recommendation</span>
                <button
                  onClick={() => {
                    const best = recommendationsQuery.data?.[0];
                    if (best) setSelectedAgentId(best.agentId);
                  }}
                  className="text-xs font-bold text-[var(--color-brand-600)] hover:underline disabled:opacity-50"
                  disabled={recommendationsQuery.isPending || !recommendationsQuery.data?.length}
                >
                  Apply Best Match
                </button>
              </div>
              <div className="mt-2 text-xs text-[var(--color-neutral-500)]">
                {recommendationsQuery.isPending ? "Analysing briefs..." : recommendationsQuery.data?.[0] ? (
                  <p>Suggests <span className="font-bold text-[var(--color-neutral-900)]">{recommendationsQuery.data[0].agentName}</span> ({recommendationsQuery.data[0].bestScore}%) &mdash; {recommendationsQuery.data[0].reasons[0]}</p>
                ) : "No clear match found."}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-neutral-500)]">Assign To Agent</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]"
              >
                <option value="">Choose an agent...</option>
                {(agentsQuery.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => assignSubmission.mutate({ submissionId: selectedSubmissionId, agentId: selectedAgentId })}
            className="mt-5 w-full rounded-md bg-[var(--color-neutral-900)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={assignSubmission.isPending || !selectedAgentId || !selectedSubmissionId || selectedSubmission?.status === "ASSIGNED"}
          >
            {assignSubmission.isPending ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(submissionsQuery.data ?? []).map((listing) => {
          const isAssigned = listing.status === "ASSIGNED";
          return (
            <article key={listing.id} className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] transition-all hover:border-[var(--color-brand-300)] hover:shadow-md">
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-[var(--color-neutral-400)]">{listing.agency}</p>
                    <h3 className="mt-0.5 text-base font-bold text-[var(--color-neutral-900)]">{listing.address}</h3>
                  </div>
                  <div className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${isAssigned ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {listing.status}
                  </div>
                </div>

                <p className="mt-0.5 text-sm text-[var(--color-neutral-600)]">{listing.suburb}, {listing.state}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--color-neutral-100)] pt-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-[var(--color-neutral-400)]">SLA / Receipt</p>
                    <p className="text-xs font-semibold text-[var(--color-neutral-700)]">
                      {isAssigned ? "Matched in " : "Pending "}
                      <span className={!isAssigned ? 'text-orange-600' : ''}>{formatSLA(listing.createdAt, listing.assignedAt)}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-[var(--color-neutral-400)]">Agent</p>
                    <p className="truncate text-xs font-semibold text-[var(--color-neutral-700)]">
                      {listing.assignedAgentId ? (agentsQuery.data?.find(a => a.id === listing.assignedAgentId)?.name ?? "Assigned") : "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-[var(--color-neutral-50)] group-hover:bg-[var(--color-brand-400)] transition-colors" />
            </article>
          );
        })}
      </section>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PropertyCard } from "@/components/property/PropertyCard";
import { ShieldAlert, AlertOctagon } from "lucide-react";

const stages = [
  "BRIEF",
  "SEARCHING",
  "SHORTLISTED",
  "DUE_DILIGENCE",
  "OFFER",
  "CONTRACTED",
  "SETTLED",
  "LOST",
] as const;

export function PropertyWorkbench() {
  const searchParams = useSearchParams();
  const requestedPropertyId = searchParams.get("propertyId");
  const utils = trpc.useUtils();
  const propertiesQuery = trpc.property.list.useQuery({});
  const clientsQuery = trpc.clients.list.useQuery();
  const [manualSelectedPropertyId, setManualSelectedPropertyId] = useState<string>("");
  const selectedPropertyId = useMemo(() => {
    const properties = propertiesQuery.data ?? [];
    if (properties.length === 0) {
      return "";
    }

    if (requestedPropertyId && properties.some((property) => property.id === requestedPropertyId)) {
      return requestedPropertyId;
    }

    if (
      manualSelectedPropertyId &&
      properties.some((property) => property.id === manualSelectedPropertyId)
    ) {
      return manualSelectedPropertyId;
    }

    return properties[0]?.id ?? "";
  }, [manualSelectedPropertyId, propertiesQuery.data, requestedPropertyId]);

  const selectedProperty = useMemo(
    () => propertiesQuery.data?.find((property) => property.id === selectedPropertyId),
    [propertiesQuery.data, selectedPropertyId],
  );

  const createProperty = trpc.property.create.useMutation({
    onSuccess: async () => {
      await utils.property.list.invalidate({});
    },
  });

  const updateProperty = trpc.property.update.useMutation({
    onSuccess: async () => {
      await utils.property.list.invalidate({});
    },
  });

  const recomputeScore = trpc.property.score.recompute.useMutation({
    onSuccess: async () => {
      await utils.property.list.invalidate({});
    },
  });

  const runDueDiligence = trpc.dueDiligence.run.useMutation({
    onSuccess: async (_, variables) => {
      await utils.dueDiligence.get.invalidate({ propertyId: variables.propertyId });
    },
  });

  const triggerAutoCheck = trpc.dueDiligence.triggerExternalFetch.useMutation({
    onSuccess: async (_, variables) => {
      await utils.dueDiligence.get.invalidate({ propertyId: variables.propertyId });
    },
  });

  const dueDiligenceQuery = trpc.dueDiligence.get.useQuery(
    { propertyId: selectedPropertyId },
    { enabled: Boolean(selectedPropertyId) },
  );

  const documentsQuery = trpc.property.document.list.useQuery(
    { propertyId: selectedPropertyId },
    { enabled: Boolean(selectedPropertyId) },
  );

  const extractFlags = trpc.property.document.extractFlags.useMutation({
    onSuccess: async () => {
      await utils.property.document.list.invalidate({ propertyId: selectedPropertyId });
    },
  });

  const approveFlag = trpc.property.document.approveFlag.useMutation({
    onSuccess: async () => {
      await utils.property.document.list.invalidate({ propertyId: selectedPropertyId });
    },
  });

  const rejectFlag = trpc.property.document.rejectFlag.useMutation({
    onSuccess: async () => {
      await utils.property.document.list.invalidate({ propertyId: selectedPropertyId });
    },
  });

  const generateDealKiller = trpc.property.generateDealKiller.useMutation();

  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const activeDocument = useMemo(
    () => documentsQuery.data?.find((d) => d.id === activeDocumentId),
    [documentsQuery.data, activeDocumentId],
  );

  const documentInitiate = trpc.document.upload.initiate.useMutation({
    onSuccess: () => {
      // Intentionally left blank as signedStorageKey was removed
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
            createProperty.mutate({
              clientId: String(form.get("clientId")) || undefined,
              address: String(form.get("address")),
              suburb: String(form.get("suburb")),
              state: String(form.get("state")) as "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT",
              postcode: String(form.get("postcode")),
              price: Number(form.get("price")) || undefined,
              stage: String(form.get("stage")) as (typeof stages)[number],
              isOffMarket: Boolean(form.get("isOffMarket")),
            });
            event.currentTarget.reset();
          }}
        >
          <h2 className="text-lg font-semibold">Add Property</h2>
          <div className="mt-3 grid gap-3">
            <select name="clientId" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm">
              <option value="">No client linked</option>
              {(clientsQuery.data ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
            <input name="address" placeholder="Address" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
            <div className="grid gap-3 md:grid-cols-3">
              <input name="suburb" placeholder="Suburb" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
              <select name="state" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" defaultValue="VIC">
                {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
              <input name="postcode" placeholder="Postcode" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="price" type="number" placeholder="Price" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" />
              <select name="stage" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" defaultValue="SEARCHING">
                {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input name="isOffMarket" type="checkbox" /> Off-market listing
            </label>
          </div>
          <button type="submit" className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white" disabled={createProperty.isPending}>
            {createProperty.isPending ? "Saving..." : "Create Property"}
          </button>
        </form>

        <form
          className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            updateProperty.mutate({
              id: selectedPropertyId,
              stage: String(form.get("stage")) as (typeof stages)[number],
            });
          }}
        >
          <h2 className="text-lg font-semibold">Update Property Stage</h2>
          <select
            value={selectedPropertyId}
            onChange={(event) => setManualSelectedPropertyId(event.target.value)}
            className="mt-3 w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
          >
            {(propertiesQuery.data ?? []).length === 0 ? <option value="">No properties found</option> : null}
            {(propertiesQuery.data ?? []).map((property) => (
              <option key={property.id} value={property.id}>
                {property.address}, {property.suburb}
              </option>
            ))}
          </select>
          <select name="stage" className="mt-3 w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" defaultValue={selectedProperty?.stage}>
            {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
          <button type="submit" className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-neutral-300)] px-4 py-2 text-sm font-medium" disabled={updateProperty.isPending || !selectedPropertyId}>
            {updateProperty.isPending ? "Updating..." : "Update Stage"}
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <form
          className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            recomputeScore.mutate({
              propertyId: selectedPropertyId,
              budgetMin: Number(form.get("budgetMin")),
              budgetMax: Number(form.get("budgetMax")),
              targetSuburbs: String(form.get("targetSuburbs"))
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
              isOffMarketPreferred: Boolean(form.get("isOffMarketPreferred")),
            });
          }}
        >
          <h2 className="text-base font-semibold">Recompute Match Score</h2>
          <input name="budgetMin" type="number" placeholder="Budget min" className="mt-3 w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
          <input name="budgetMax" type="number" placeholder="Budget max" className="mt-2 w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
          <input name="targetSuburbs" placeholder="Target suburbs" className="mt-2 w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input name="isOffMarketPreferred" type="checkbox" /> Prefer off-market
          </label>
          <button type="submit" className="mt-3 rounded border border-[var(--color-neutral-300)] px-3 py-2 text-sm" disabled={recomputeScore.isPending || !selectedPropertyId}>
            {recomputeScore.isPending ? "Computing..." : "Compute"}
          </button>
          {recomputeScore.data ? (
            <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
              Score {recomputeScore.data.match.score} ({recomputeScore.data.match.category})
            </p>
          ) : null}
        </form>

        <form
          className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            runDueDiligence.mutate({
              propertyId: selectedPropertyId,
              floodRisk: String(form.get("floodRisk")) as "LOW" | "MEDIUM" | "HIGH",
              bushfireRisk: String(form.get("bushfireRisk")) as "LOW" | "MEDIUM" | "HIGH",
              zoningChangeFlag: Boolean(form.get("zoningChangeFlag")),
              recentComparableDeltaPct: Number(form.get("recentComparableDeltaPct")),
            });
          }}
        >
          <h2 className="text-base font-semibold">Due Diligence</h2>
          <div className="mt-3 grid gap-2">
            <select name="floodRisk" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" defaultValue="LOW">
              <option value="LOW">Flood Low</option>
              <option value="MEDIUM">Flood Medium</option>
              <option value="HIGH">Flood High</option>
            </select>
            <select name="bushfireRisk" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" defaultValue="LOW">
              <option value="LOW">Bushfire Low</option>
              <option value="MEDIUM">Bushfire Medium</option>
              <option value="HIGH">Bushfire High</option>
            </select>
            <input name="recentComparableDeltaPct" type="number" step="0.1" defaultValue="0" className="rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input name="zoningChangeFlag" type="checkbox" /> Zoning change flag</label>
          </div>
          <button type="submit" className="mt-3 rounded border border-[var(--color-neutral-300)] px-3 py-2 text-sm" disabled={runDueDiligence.isPending || !selectedPropertyId}>
            {runDueDiligence.isPending ? "Running..." : "Run"}
          </button>

          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-medium">External Data Connectors</h3>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[var(--color-neutral-500)]">
                Status: {dueDiligenceQuery.data?.status || "NOT_STARTED"}
              </span>
              <button
                type="button"
                onClick={() => triggerAutoCheck.mutate({ propertyId: selectedPropertyId })}
                disabled={triggerAutoCheck.isPending || dueDiligenceQuery.data?.status === "PENDING" || !selectedPropertyId}
                className="rounded bg-[var(--color-primary-600)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50"
              >
                {triggerAutoCheck.isPending || dueDiligenceQuery.data?.status === "PENDING" ? "Checking..." : "Auto-Check"}
              </button>
            </div>
            {dueDiligenceQuery.data?.lastFetchedAt && (
              <p className="mt-1 text-[10px] text-[var(--color-neutral-400)]">
                Last checked: {new Date(dueDiligenceQuery.data.lastFetchedAt).toLocaleString()}
              </p>
            )}
          </div>

          {dueDiligenceQuery.data && dueDiligenceQuery.data.status !== "PENDING" ? (
            <p className="mt-2 text-xs text-[var(--color-neutral-500)]">Risk score: {dueDiligenceQuery.data.riskScore}</p>
          ) : null}
        </form>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)] lg:col-span-1">
          <h2 className="text-base font-semibold">Documents & Red Flags</h2>

          <form
            className="mt-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              documentInitiate.mutate({
                propertyId: selectedPropertyId,
                fileName: String(form.get("fileName")),
                mimeType: String(form.get("mimeType")),
                sizeBytes: Number(form.get("sizeBytes")),
              });
            }}
          >
            <div className="flex gap-2">
              <input name="fileName" placeholder="Filename..." className="flex-1 rounded border border-[var(--color-neutral-200)] px-2 py-1.5 text-xs" required />
              <button type="submit" className="rounded bg-[var(--color-neutral-100)] px-3 py-1.5 text-xs font-medium" disabled={documentInitiate.isPending || !selectedPropertyId}>
                Add
              </button>
            </div>
            <input type="hidden" name="mimeType" value="application/pdf" />
            <input type="hidden" name="sizeBytes" value="102400" />
          </form>

          <div className="mt-4 space-y-3">
            {(documentsQuery.data ?? []).length === 0 && (
              <p className="py-4 text-center text-xs text-[var(--color-neutral-400)] italic">No documents uploaded</p>
            )}
            {(documentsQuery.data ?? []).map((doc) => (
              <div key={doc.id} className="rounded border border-[var(--color-neutral-100)] p-3 shadow-sm hover:border-[var(--color-brand-200)] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.fileName}</p>
                    <p className="text-[10px] text-[var(--color-neutral-500)]">Status: {doc.status}</p>
                  </div>
                  <button
                    onClick={() => extractFlags.mutate({ documentId: doc.id })}
                    disabled={extractFlags.isPending || doc.status === "PROCESSING" || doc.status === "COMPLETED"}
                    className="ml-2 rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] bg-white px-2 py-1 text-[10px] font-medium hover:bg-neutral-50"
                  >
                    {doc.status === "COMPLETED" ? "Flags Extracted" : doc.status === "PROCESSING" ? "Processing..." : "Extract Flags"}
                  </button>
                </div>

                {doc.status === "COMPLETED" && (
                  <button
                    onClick={() => setActiveDocumentId(activeDocumentId === doc.id ? null : doc.id)}
                    className="mt-2 text-[10px] font-semibold text-[var(--color-brand-600)]"
                  >
                    {activeDocumentId === doc.id ? "Hide Flags" : "View Red Flags"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {activeDocumentId && selectedPropertyId && (
            <div className="mt-6 border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-red-600 flex items-center gap-1">
                  <span>🚩</span> Red Flags: {activeDocument?.fileName}
                </h3>
              </div>

              <FlagList
                documentId={activeDocumentId}
                onApprove={(id) => approveFlag.mutate({ flagId: id, status: "APPROVED" })}
                onReject={(id) => rejectFlag.mutate({ flagId: id, status: "REJECTED" })}
              />
            </div>
          )}
        </div>
      </section>

      {selectedPropertyId && (
        <section className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-neutral-100)] pb-4">
            <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6" /> The Deal Killer Engine
            </h2>
            <button
              onClick={() => generateDealKiller.mutate({ propertyId: selectedPropertyId })}
              disabled={generateDealKiller.isPending || !selectedPropertyId}
              className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {generateDealKiller.isPending ? "Analyzing Risk..." : "Generate Risk Report"}
            </button>
          </div>

          {generateDealKiller.data && (
            <div className={`mt-4 rounded-lg p-5 border animate-in fade-in slide-in-from-top-2 duration-500 ${generateDealKiller.data.overallRisk === "CATASTROPHIC" ? "bg-red-50 border-red-200" : generateDealKiller.data.overallRisk === "HIGH" ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
              <div className="flex items-start gap-4 mb-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase whitespace-nowrap tracking-wider shadow-sm ${generateDealKiller.data.overallRisk === "CATASTROPHIC" ? "bg-red-600 text-white" : generateDealKiller.data.overallRisk === "HIGH" ? "bg-orange-500 text-white" : "bg-green-600 text-white"}`}>
                  Risk: {generateDealKiller.data.overallRisk}
                </span>
                <p className="text-[15px] font-bold text-neutral-900 mt-1 leading-relaxed">{generateDealKiller.data.summary}</p>
              </div>

              {generateDealKiller.data.dealKillers.length > 0 && (
                <div className="mt-6 space-y-3 border-t border-red-200/60 pt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5"><AlertOctagon className="w-4 h-4" /> Critical Red Flags (Deal Killers)</h4>
                  <ul className="list-none space-y-2 mt-3">
                    {generateDealKiller.data.dealKillers.map((dk: string, i: number) => (
                      <li key={i} className="text-sm text-red-900 font-medium bg-white p-3.5 rounded border border-red-100 shadow-sm flex items-start gap-2.5">
                        <span className="text-red-500 mt-0.5">▪</span> {dk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(propertiesQuery.data ?? []).map((item) => (
          <button key={item.id} onClick={() => setManualSelectedPropertyId(item.id)} className="text-left">
            <PropertyCard
              address={`${item.address}, ${item.suburb} ${item.state}`}
              stage={item.stage}
              score={item.matchScore ?? 0}
              offMarket={item.isOffMarket}
            />
          </button>
        ))}
      </section>
    </div>
  );
}

function FlagList({
  documentId,
  onApprove,
  onReject
}: {
  documentId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const docWithFlags = trpc.property.document.get.useQuery({ documentId });

  if (docWithFlags.isLoading) return <p className="text-[10px] text-neutral-400">Loading flags...</p>;

  const flags = docWithFlags.data?.redFlags || [];

  if (flags.length === 0) return <p className="text-[10px] text-neutral-400 italic">No flags found.</p>;

  return (
    <div className="space-y-3">
      {flags.map((flag) => (
        <div key={flag.id} className="rounded border bg-red-50/30 p-2.5 border-red-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${flag.severity === "HIGH" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                  }`}>
                  {flag.severity}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">{flag.category}</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-800">{flag.content}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            {flag.status === "UNREVIEWED" ? (
              <>
                <button
                  onClick={() => onReject(flag.id)}
                  className="rounded bg-white border border-neutral-200 px-2.5 py-1 text-[10px] font-medium hover:bg-neutral-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => onApprove(flag.id)}
                  className="rounded bg-[var(--color-brand-600)] px-2.5 py-1 text-[10px] font-medium text-white shadow-sm"
                >
                  Approve
                </button>
              </>
            ) : (
              <span className={`text-[10px] font-bold ${flag.status === "APPROVED" ? "text-green-600" : "text-neutral-500"}`}>
                {flag.status === "APPROVED" ? "✓ APPROVED" : "✕ REJECTED"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

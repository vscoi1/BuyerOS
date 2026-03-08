"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PropertyCard } from "@/components/property/PropertyCard";

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
  const utils = trpc.useUtils();
  const propertiesQuery = trpc.property.list.useQuery({});
  const clientsQuery = trpc.clients.list.useQuery();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("property_demo_1");
  const [signedStorageKey, setSignedStorageKey] = useState<string>("");

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

  const dueDiligenceQuery = trpc.dueDiligence.get.useQuery(
    { propertyId: selectedPropertyId },
    { enabled: Boolean(selectedPropertyId) },
  );

  const documentInitiate = trpc.document.upload.initiate.useMutation({
    onSuccess: (data) => {
      setSignedStorageKey(data.storageKey);
    },
  });

  const signedUrlQuery = trpc.document.getSignedUrl.useQuery(
    { storageKey: signedStorageKey },
    { enabled: Boolean(signedStorageKey) },
  );

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
                {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map((state) => <option key={state} value={state}>{state}</option>)}
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
            onChange={(event) => setSelectedPropertyId(event.target.value)}
            className="mt-3 w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
          >
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
          {dueDiligenceQuery.data ? (
            <p className="mt-2 text-xs text-[var(--color-neutral-500)]">Risk score: {dueDiligenceQuery.data.riskScore}</p>
          ) : null}
        </form>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-base font-semibold">Document URLs</h2>
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
            <input name="fileName" placeholder="contract.pdf" className="w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
            <input name="mimeType" placeholder="application/pdf" className="mt-2 w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
            <input name="sizeBytes" type="number" placeholder="10240" className="mt-2 w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm" required />
            <button type="submit" className="mt-2 rounded border border-[var(--color-neutral-300)] px-3 py-2 text-sm" disabled={documentInitiate.isPending || !selectedPropertyId}>
              {documentInitiate.isPending ? "Generating..." : "Initiate Upload"}
            </button>
          </form>
          {documentInitiate.data ? (
            <div className="mt-2 text-xs text-[var(--color-neutral-500)]">
              <p>Storage key: {documentInitiate.data.storageKey}</p>
              <p className="truncate">Upload URL: {documentInitiate.data.uploadUrl}</p>
            </div>
          ) : null}
          {signedUrlQuery.data ? (
            <p className="mt-2 truncate text-xs text-[var(--color-neutral-500)]">Read URL: {signedUrlQuery.data.signedUrl}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(propertiesQuery.data ?? []).map((item) => (
          <button key={item.id} onClick={() => setSelectedPropertyId(item.id)} className="text-left">
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

"use client";

import { StatCard } from "@/components/overview/StatCard";
import { PropertyCard } from "@/components/property/PropertyCard";
import { trpc } from "@/lib/trpc/client";

export function OverviewLive() {
  const clients = trpc.clients.list.useQuery();
  const properties = trpc.property.list.useQuery({});
  const submissions = trpc.offMarket.list.useQuery();

  const clientCount = clients.data?.length ?? 0;
  const propertyCount = properties.data?.length ?? 0;
  const dueDiligenceCount = (properties.data ?? []).filter(
    (property) => property.stage === "DUE_DILIGENCE",
  ).length;
  const offMarketCount = (properties.data ?? []).filter((property) => property.isOffMarket).length;

  const statItems = [
    { label: "Active Clients", value: clientCount, trend: "+0%" },
    { label: "Properties Tracked", value: propertyCount, trend: "+0%" },
    { label: "Due Diligence Pending", value: dueDiligenceCount, trend: "+0%" },
    {
      label: "Off-Market Inbox",
      value: submissions.data?.length ?? offMarketCount,
      trend: "+0%",
    },
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} trend={item.trend} />
        ))}
      </section>

      <section className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
        <h2 className="text-lg font-semibold">Property Pipeline</h2>
        <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
          Live property list from the agent workspace.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {properties.data?.length ? (
            properties.data.map((item) => (
              <PropertyCard
                key={item.id}
                address={`${item.address}, ${item.suburb} ${item.state}`}
                stage={item.stage}
                score={item.matchScore ?? 0}
                offMarket={item.isOffMarket}
              />
            ))
          ) : (
            <p className="text-sm text-[var(--color-neutral-500)]">
              No properties yet. Add one in the Properties tab.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function StampDutyWorkbench() {
  const [state, setState] = useState<"NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT">("VIC");
  const [purchasePrice, setPurchasePrice] = useState(1_150_000);
  const [isForeignBuyer, setIsForeignBuyer] = useState(false);

  const estimateQuery = trpc.analysis.stampDutyEstimate.useQuery(
    { state, purchasePrice, isForeignBuyer },
    { enabled: purchasePrice > 0 },
  );

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
      <h2 className="text-lg font-semibold">Stamp Duty Estimator</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <select value={state} onChange={(event) => setState(event.target.value as typeof state)} className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm">
          {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <input value={purchasePrice} onChange={(event) => setPurchasePrice(Number(event.target.value))} type="number" className="rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm">
          <input type="checkbox" checked={isForeignBuyer} onChange={(event) => setIsForeignBuyer(event.target.checked)} />
          Foreign buyer
        </label>
      </div>

      {estimateQuery.data ? (
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <p>Base duty: <strong>{formatCurrency(estimateQuery.data.baseDuty)}</strong></p>
          <p>Foreign surcharge: <strong>{formatCurrency(estimateQuery.data.foreignSurcharge)}</strong></p>
          <p>Total duty: <strong>{formatCurrency(estimateQuery.data.totalDuty)}</strong></p>
          <p>Effective rate: <strong>{estimateQuery.data.effectiveRatePct}%</strong></p>
        </div>
      ) : null}
    </section>
  );
}

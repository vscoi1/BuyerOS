interface SuburbInsightCardProps {
  suburb: string;
  state: "NSW" | "VIC";
  growthScore: number;
  yieldRange: string;
  rationale: string;
}

export function SuburbInsightCard({ suburb, state, growthScore, yieldRange, rationale }: SuburbInsightCardProps) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {suburb}, {state}
        </h3>
        <span className="rounded-full bg-[var(--color-brand-50)] px-2 py-1 text-xs font-medium text-[var(--color-brand-900)]">
          Score {growthScore}
        </span>
      </div>
      <p className="mt-3 text-sm text-[var(--color-neutral-700)]">{rationale}</p>
      <p className="mt-3 text-sm text-[var(--color-neutral-500)]">Projected yield: {yieldRange}</p>
    </article>
  );
}

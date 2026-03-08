interface PropertyCardProps {
  address: string;
  stage: string;
  score: number;
  offMarket: boolean;
}

export function PropertyCard({ address, stage, score, offMarket }: PropertyCardProps) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-neutral-900)]">{address}</p>
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">{stage.replaceAll("_", " ")}</p>
        </div>
        {offMarket ? (
          <span className="rounded-full bg-[var(--color-brand-50)] px-2 py-1 text-xs font-medium text-[var(--color-brand-900)]">
            Off-market
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-[var(--color-neutral-500)]">
          <span>Match score</span>
          <span>{score}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-neutral-100)]">
          <div
            className="h-1.5 rounded-full bg-[var(--color-brand-500)]"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </article>
  );
}

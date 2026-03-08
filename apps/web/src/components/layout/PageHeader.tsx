interface PageHeaderProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
}

export function PageHeader({ title, subtitle, actionLabel }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-neutral-900)]">{title}</h1>
        <p className="text-sm text-[var(--color-neutral-500)]">{subtitle}</p>
      </div>
      {actionLabel ? (
        <button className="rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-600)]">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

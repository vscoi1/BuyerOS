interface AdvisoryNoticeProps {
  title: string;
  body: string;
  tone?: "info" | "warning";
  compact?: boolean;
}

export function AdvisoryNotice({
  title,
  body,
  tone = "info",
  compact = false,
}: AdvisoryNoticeProps) {
  const toneClasses =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-700)]";

  return (
    <div className={`rounded-[var(--radius-md)] border ${toneClasses} ${compact ? "p-2.5" : "p-3"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-xs leading-relaxed">{body}</p>
    </div>
  );
}

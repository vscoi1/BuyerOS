import { Bell, Search } from "lucide-react";

interface TopBarProps {
  agentName: string;
}

export function TopBar({ agentName }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-neutral-200)] bg-[var(--surface-1)] backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex w-full max-w-md items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] px-3 py-2">
          <Search size={16} className="text-[var(--color-neutral-500)]" />
          <input
            aria-label="Search"
            placeholder="Search clients, properties, suburbs"
            className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[var(--color-neutral-500)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-2"
          >
            <Bell size={16} />
          </button>
          <div className="hidden rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] px-3 py-2 text-sm md:block">
            {agentName}
          </div>
        </div>
      </div>
    </header>
  );
}

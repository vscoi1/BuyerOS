"use client";

import { Bell, Building2, House, LogOut, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth-actions";
import { trpc } from "@/lib/trpc/client";

interface TopBarProps {
  agentName: string;
}

type SearchResult = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  type: "CLIENT" | "PROPERTY" | "OFF_MARKET";
  rank: number;
};

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function rankMatch(haystack: string, needle: string): number {
  const normalizedHaystack = normalize(haystack);
  if (normalizedHaystack.startsWith(needle)) {
    return 0;
  }
  if (normalizedHaystack.includes(needle)) {
    return 1;
  }
  return -1;
}

function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <button
      id="logout-btn"
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      aria-label="Sign out"
      title="Sign out"
      className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--color-neutral-700)] transition hover:border-[var(--color-error-500)] hover:text-[var(--color-error-500)] disabled:opacity-50"
    >
      <LogOut size={14} />
      <span className="hidden md:inline">{isPending ? "Signing out…" : "Logout"}</span>
    </button>
  );
}

export function TopBar({ agentName }: TopBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const clientsQuery = trpc.clients.list.useQuery();
  const propertiesQuery = trpc.property.list.useQuery({});
  const offMarketQuery = trpc.offMarket.list.useQuery();

  const normalizedQuery = normalize(query);

  const results = useMemo<SearchResult[]>(() => {
    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const clientResults: SearchResult[] = (clientsQuery.data ?? [])
      .map((client) => {
        const searchable = [
          client.firstName,
          client.lastName,
          client.email,
          client.targetSuburbs.join(" "),
          client.briefSummary,
        ].join(" ");
        const rank = rankMatch(searchable, normalizedQuery);

        if (rank < 0) {
          return null;
        }

        return {
          id: `client:${client.id}`,
          href: `/clients?clientId=${encodeURIComponent(client.id)}`,
          title: `${client.firstName} ${client.lastName}`,
          subtitle: `Client · ${client.targetSuburbs.join(", ")}`,
          type: "CLIENT",
          rank,
        };
      })
      .filter((item): item is SearchResult => item !== null);

    const propertyResults: SearchResult[] = (propertiesQuery.data ?? [])
      .map((property) => {
        const searchable = [
          property.address,
          property.suburb,
          property.state,
          property.postcode,
          property.stage,
          property.isOffMarket ? "off market" : "on market",
        ].join(" ");
        const rank = rankMatch(searchable, normalizedQuery);

        if (rank < 0) {
          return null;
        }

        return {
          id: `property:${property.id}`,
          href: `/properties?propertyId=${encodeURIComponent(property.id)}`,
          title: property.address,
          subtitle: `Property · ${property.suburb}, ${property.state} · ${property.stage}`,
          type: "PROPERTY",
          rank,
        };
      })
      .filter((item): item is SearchResult => item !== null);

    const offMarketResults: SearchResult[] = (offMarketQuery.data ?? [])
      .map((submission) => {
        const searchable = [
          submission.address,
          submission.suburb,
          submission.state,
          submission.postcode,
          submission.agency,
          submission.sellingAgent,
          submission.status,
        ].join(" ");
        const rank = rankMatch(searchable, normalizedQuery);

        if (rank < 0) {
          return null;
        }

        return {
          id: `off-market:${submission.id}`,
          href: `/off-market?submissionId=${encodeURIComponent(submission.id)}`,
          title: submission.address,
          subtitle: `Off-market · ${submission.suburb}, ${submission.state} · ${submission.status}`,
          type: "OFF_MARKET",
          rank,
        };
      })
      .filter((item): item is SearchResult => item !== null);

    return [...clientResults, ...propertyResults, ...offMarketResults]
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        return a.title.localeCompare(b.title);
      })
      .slice(0, MAX_RESULTS);
  }, [clientsQuery.data, normalizedQuery, offMarketQuery.data, propertiesQuery.data]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onShortcut);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onShortcut);
    };
  }, []);

  function goToResult(result: SearchResult) {
    router.push(result.href);
    setIsOpen(false);
    setQuery("");
  }

  const isLoading = clientsQuery.isLoading || propertiesQuery.isLoading || offMarketQuery.isLoading;
  const showDropdown = isOpen && normalizedQuery.length >= MIN_QUERY_LENGTH;
  const activeResultIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-neutral-200)] bg-[var(--surface-1)] backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div ref={containerRef} className="relative w-full max-w-xl">
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] px-3 py-2">
            <Search size={16} className="text-[var(--color-neutral-500)]" />
            <input
              ref={inputRef}
              aria-label="Search"
              placeholder="Search clients, properties, suburbs"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
                if (!isOpen) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (!showDropdown) {
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((current) => (results.length === 0 ? 0 : (current + 1) % results.length));
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    results.length === 0 ? 0 : (current - 1 + results.length) % results.length,
                  );
                  return;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  const selected = results[activeResultIndex];
                  if (selected) {
                    goToResult(selected);
                  }
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setIsOpen(false);
                }
              }}
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[var(--color-neutral-500)]"
            />
            <span className="hidden text-xs text-[var(--color-neutral-500)] md:inline">Ctrl/Cmd+K</span>
          </div>

          {showDropdown ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-2 shadow-[var(--shadow-md)]">
              {isLoading ? (
                <p className="px-2 py-2 text-sm text-[var(--color-neutral-500)]">Loading search index...</p>
              ) : null}

              {!isLoading && results.length === 0 ? (
                <p className="px-2 py-2 text-sm text-[var(--color-neutral-500)]">No matching clients, properties, or off-market listings.</p>
              ) : null}

              {!isLoading ? (
                <ul className="space-y-1">
                  {results.map((result, index) => {
                    const active = index === activeResultIndex;
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => goToResult(result)}
                          className={`flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left transition ${active ? "bg-[var(--color-brand-50)]" : "hover:bg-[var(--color-neutral-50)]"
                            }`}
                        >
                          {result.type === "CLIENT" ? (
                            <UserRound size={14} className="text-[var(--color-neutral-500)]" />
                          ) : null}
                          {result.type === "PROPERTY" ? (
                            <House size={14} className="text-[var(--color-neutral-500)]" />
                          ) : null}
                          {result.type === "OFF_MARKET" ? (
                            <Building2 size={14} className="text-[var(--color-neutral-500)]" />
                          ) : null}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{result.title}</span>
                            <span className="block truncate text-xs text-[var(--color-neutral-500)]">{result.subtitle}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-2"
          >
            <Bell size={16} />
          </button>
          <div className="hidden rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] px-3 py-2 text-sm md:flex md:items-center md:gap-2">
            <span>{agentName}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

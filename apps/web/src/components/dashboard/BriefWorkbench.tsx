"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { AdvisoryNotice } from "@/components/compliance/AdvisoryNotice";
import { SAFE_AI_COPY } from "@/lib/safe-ai";

export function BriefWorkbench() {
  const parseBrief = trpc.brief.parse.useMutation();
  const [sourceText, setSourceText] = useState(
    "Client needs 2 bedrooms in Brunswick or Northcote, budget between 950k and 1.2m, close to transport.",
  );

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
      <h2 className="text-lg font-semibold">AI Brief Parser</h2>
      <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
        Paste intake notes and parse structured buying criteria.
      </p>

      <div className="mt-3 space-y-2">
        <AdvisoryNotice
          title={SAFE_AI_COPY.global.title}
          body={SAFE_AI_COPY.global.body}
          compact
        />
        <AdvisoryNotice
          title={SAFE_AI_COPY.briefParser.title}
          body={SAFE_AI_COPY.briefParser.body}
          compact
        />
      </div>

      <textarea
        value={sourceText}
        onChange={(event) => setSourceText(event.target.value)}
        className="mt-3 min-h-32 w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
      />
      <button
        className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white"
        onClick={() => parseBrief.mutate({ sourceText })}
        disabled={parseBrief.isPending}
      >
        {parseBrief.isPending ? "Parsing..." : "Parse Brief"}
      </button>

      {parseBrief.data ? (
        <div className="mt-4 rounded border border-[var(--color-neutral-200)] bg-[var(--surface-1)] p-3 text-sm">
          <p><strong>Budget:</strong> {parseBrief.data.budgetMin ?? "-"} to {parseBrief.data.budgetMax ?? "-"}</p>
          <p><strong>Bedrooms min:</strong> {parseBrief.data.bedroomsMin ?? "-"}</p>
          <p><strong>Target suburbs:</strong> {parseBrief.data.targetSuburbs.join(", ") || "-"}</p>
          <p><strong>Confidence:</strong> {Math.round(parseBrief.data.confidence * 100)}%</p>
          <p className="mt-1 text-[var(--color-neutral-500)]">{parseBrief.data.summary}</p>
        </div>
      ) : null}
    </section>
  );
}

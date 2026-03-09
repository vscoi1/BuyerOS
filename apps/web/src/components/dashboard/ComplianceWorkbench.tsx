"use client";

import { trpc } from "@/lib/trpc/client";
import { AdvisoryNotice } from "@/components/compliance/AdvisoryNotice";
import { SAFE_AI_COPY } from "@/lib/safe-ai";

export function ComplianceWorkbench() {
  const utils = trpc.useUtils();
  const checklistsQuery = trpc.compliance.checklist.list.useQuery();

  const updateItem = trpc.compliance.checklist.updateItem.useMutation({
    onSuccess: async () => {
      await utils.compliance.checklist.list.invalidate();
    },
  });
  const attachEvidence = trpc.compliance.checklist.attachEvidence.useMutation({
    onSuccess: async () => {
      await utils.compliance.checklist.list.invalidate();
    },
  });
  const migrateChecklist = trpc.compliance.checklist.migrate.useMutation({
    onSuccess: async () => {
      await utils.compliance.checklist.list.invalidate();
    },
  });

  if (checklistsQuery.isLoading) {
    return (
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]">
        <p className="text-sm text-[var(--color-neutral-500)]">Loading compliance checklists...</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <AdvisoryNotice title={SAFE_AI_COPY.global.title} body={SAFE_AI_COPY.global.body} />
      <section className="grid gap-4 lg:grid-cols-2">
        {(checklistsQuery.data ?? []).map((checklist) => (
          <article
            key={checklist.state}
            className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{checklist.state} checklist</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">
                  Policy version {checklist.policyVersion} · Updated{" "}
                  {new Date(checklist.updatedAt).toLocaleString("en-AU")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => migrateChecklist.mutate({ state: checklist.state })}
                className="rounded border border-[var(--color-neutral-300)] px-3 py-1.5 text-xs font-medium"
                disabled={migrateChecklist.isPending}
              >
                {migrateChecklist.isPending ? "Migrating..." : "Migrate Policy"}
              </button>
            </div>

            <ul className="mt-3 space-y-3 text-sm">
              {checklist.items.map((item) => (
                <li key={item.code} className="rounded border border-[var(--color-neutral-100)] p-3">
                  <form
                    className="space-y-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      updateItem.mutate({
                        state: checklist.state,
                        code: item.code,
                        completed: form.get("completed") === "on",
                        evidenceNote: String(form.get("evidenceNote") ?? "").trim() || undefined,
                      });
                    }}
                  >
                    <label className="flex items-start gap-2">
                      <input name="completed" type="checkbox" defaultChecked={item.completed} className="mt-0.5" />
                      <span>
                        <span className="font-medium">{item.code}</span>
                        <span className="ml-2">{item.label}</span>
                      </span>
                    </label>

                    <input
                      name="evidenceNote"
                      defaultValue={item.evidenceNote ?? ""}
                      placeholder="Evidence note (optional)"
                      className="w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-sm"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-[var(--color-neutral-500)]">
                        {item.completedAt
                          ? `Completed ${new Date(item.completedAt).toLocaleString("en-AU")}`
                          : "Not completed"}
                      </p>
                      <button
                        type="submit"
                        className="rounded border border-[var(--color-neutral-300)] px-3 py-1.5 text-xs font-medium"
                        disabled={updateItem.isPending}
                      >
                        {updateItem.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>

                  <form
                    className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      attachEvidence.mutate({
                        state: checklist.state,
                        code: item.code,
                        fileName: String(form.get("fileName") ?? "").trim(),
                        url: String(form.get("url") ?? "").trim(),
                      });
                      event.currentTarget.reset();
                    }}
                  >
                    <input
                      name="fileName"
                      placeholder="Evidence filename"
                      className="w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-xs"
                      required
                    />
                    <input
                      name="url"
                      type="url"
                      placeholder="https://evidence-link"
                      className="w-full rounded border border-[var(--color-neutral-200)] px-2 py-2 text-xs"
                      required
                    />
                    <button
                      type="submit"
                      className="rounded border border-[var(--color-neutral-300)] px-3 py-1.5 text-xs font-medium"
                      disabled={attachEvidence.isPending}
                    >
                      {attachEvidence.isPending ? "Attaching..." : "Attach"}
                    </button>
                  </form>

                  {item.attachments.length > 0 ? (
                    <ul className="mt-2 space-y-1 border-t border-[var(--color-neutral-100)] pt-2">
                      {item.attachments.map((attachment) => (
                        <li key={`${item.code}-${attachment.fileName}-${attachment.createdAt}`} className="text-xs">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-[var(--color-brand-600)] hover:underline"
                          >
                            {attachment.fileName}
                          </a>
                          <span className="ml-1 text-[var(--color-neutral-500)]">
                            · {new Date(attachment.createdAt).toLocaleString("en-AU")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

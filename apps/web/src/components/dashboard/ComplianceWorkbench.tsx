"use client";

import { trpc } from "@/lib/trpc/client";

export function ComplianceWorkbench() {
  const utils = trpc.useUtils();
  const checklistsQuery = trpc.compliance.checklist.list.useQuery();

  const updateItem = trpc.compliance.checklist.updateItem.useMutation({
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
    <section className="grid gap-4 lg:grid-cols-2">
      {(checklistsQuery.data ?? []).map((checklist) => (
        <article
          key={checklist.state}
          className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
        >
          <h2 className="text-lg font-semibold">{checklist.state} checklist</h2>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Policy version {checklist.policyVersion} · Updated{" "}
            {new Date(checklist.updatedAt).toLocaleString("en-AU")}
          </p>

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
                      {item.completedAt ? `Completed ${new Date(item.completedAt).toLocaleString("en-AU")}` : "Not completed"}
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
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

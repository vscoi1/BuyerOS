import { portalLoginAction } from "@/lib/actions/portal-auth-actions";

export default async function PortalLoginPage({
  searchParams,
}: PageProps<"/portal/login">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <section className="w-full rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-xs)]">
        <h1 className="text-2xl font-semibold">Client Portal Login</h1>
        <p className="mt-2 text-sm text-[var(--color-neutral-500)]">
          Enter your secure access token shared by your buyer&apos;s agent.
        </p>

        {error ? (
          <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            Access token is invalid or expired. Please request a new token from your buyer&apos;s agent.
          </p>
        ) : null}

        <form action={portalLoginAction} className="mt-4 space-y-3">
          <input
            name="token"
            defaultValue={token ?? ""}
            placeholder="Paste your portal token"
            className="w-full rounded border border-[var(--color-neutral-200)] px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white"
          >
            Sign in to Portal
          </button>
        </form>
      </section>
    </main>
  );
}

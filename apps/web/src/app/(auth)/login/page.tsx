import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-8 shadow-[var(--shadow-md)]">
        <p className="text-sm font-semibold tracking-wide text-[var(--color-brand-900)]">BuyerOS</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign in to your agent workspace</h1>
        <form className="mt-6 space-y-4">
          <label className="block text-sm">
            <span>Email</span>
            <input className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] px-3 py-2" type="email" placeholder="agent@buyersos.au" />
          </label>
          <label className="block text-sm">
            <span>Password</span>
            <input className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] px-3 py-2" type="password" />
          </label>
          <Link href="/overview" className="block rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[var(--color-brand-600)]">
            Continue
          </Link>
        </form>
      </section>
    </main>
  );
}

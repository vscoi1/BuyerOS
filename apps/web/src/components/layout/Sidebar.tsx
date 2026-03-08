"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { dashboardNav } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-[var(--color-neutral-200)] bg-[var(--surface-0)] lg:block">
      <div className="flex h-16 items-center border-b border-[var(--color-neutral-200)] px-5">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--color-brand-900)]">BuyerOS</p>
          <p className="text-xs text-[var(--color-neutral-500)]">Agent Operating System</p>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {dashboardNav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-brand-50)] text-[var(--color-brand-900)]"
                    : "text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

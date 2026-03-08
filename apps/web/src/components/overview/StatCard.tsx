"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: number;
  trend: string;
}

export function StatCard({ label, value, trend }: StatCardProps) {
  const trendUp = trend.startsWith("+");

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-xs)]"
    >
      <p className="text-sm text-[var(--color-neutral-500)]">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className={`mt-2 text-sm ${trendUp ? "text-[var(--color-success-500)]" : "text-[var(--color-error-500)]"}`}>
        {trend} vs last 30 days
      </p>
    </motion.article>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioTower, Sparkles, Building, Users, Link as LinkIcon, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

export default function WhisperNetworkPage() {
    const [rawText, setRawText] = useState("");
    const ingestMutation = trpc.whisper.ingest.useMutation();

    const handleIngest = async () => {
        if (rawText.trim().length < 10) return;
        try {
            await ingestMutation.mutateAsync({ rawContent: rawText });
            setRawText(""); // Clear on success
        } catch (e) {
            console.error("Failed to ingest", e);
        }
    };

    const isSuccess = ingestMutation.isSuccess && ingestMutation.data;

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-[var(--color-brand-900)]">
                        <RadioTower className="h-8 w-8 text-[var(--color-brand-600)]" />
                        The Whisper Network
                    </h1>
                    <p className="mt-2 text-[var(--color-neutral-600)]">
                        Automated Off-Market Dark Pool. Paste generic selling agent emails here. Our AI will instantly parse the details and match it to your active buyers.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Input Section */}
                <div className="space-y-4">
                    <div className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-sm">
                        <label htmlFor="rawEmail" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-900)]">
                            Paste Raw Email / Text Message
                        </label>
                        <textarea
                            id="rawEmail"
                            className="h-64 w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface-50)] p-4 text-sm font-mono text-[var(--color-neutral-800)] focus:border-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)]"
                            placeholder="e.g. Hi Team, I have a quiet off-market listing coming up. Address: 123 Smith St, Richmond. Guide is $1.2m..."
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            disabled={ingestMutation.isPending}
                        />
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-[var(--color-neutral-500)]">
                                Powered by BuyerOS Intelligence
                            </p>
                            <button
                                onClick={handleIngest}
                                disabled={ingestMutation.isPending || rawText.trim().length < 10}
                                className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-brand-700)] disabled:opacity-50"
                            >
                                {ingestMutation.isPending ? (
                                    <>
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                            <Sparkles className="h-4 w-4" />
                                        </motion.div>
                                        Parsing Data...
                                    </>
                                ) : (
                                    <>
                                        <RadioTower className="h-4 w-4" />
                                        Ingest & Match
                                    </>
                                )}
                            </button>
                        </div>
                        {ingestMutation.isError && (
                            <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                                <AlertCircle className="h-4 w-4" />
                                Failed to parse contents.
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                    <AnimatePresence mode="wait">
                        {!isSuccess ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex h-full flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--color-neutral-300)] bg-[var(--surface-50)] p-12 text-center"
                            >
                                <div className="rounded-full bg-[var(--color-neutral-200)] p-4 shadow-inner">
                                    <RadioTower className="h-8 w-8 text-[var(--color-neutral-400)]" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold text-[var(--color-neutral-900)]">Awaiting Signal</h3>
                                <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
                                    Submit a listing to see AI extraction and buyer matching in real-time.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Extracted Property Card */}
                                <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-brand-200)] bg-[var(--surface-0)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[var(--color-brand-100)]">
                                    <div className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] px-6 py-4">
                                        <div className="flex items-center gap-2 text-white">
                                            <Sparkles className="h-5 w-5 opacity-90" />
                                            <h3 className="font-semibold">Successfully Parsed Listing</h3>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-lg bg-[var(--color-brand-50)] p-3">
                                                <Building className="h-6 w-6 text-[var(--color-brand-600)]" />
                                            </div>
                                            <div>
                                                <Link href={`/properties`} className="group flex items-center gap-2">
                                                    <p className="text-xl font-bold text-[var(--color-neutral-900)] group-hover:text-[var(--color-brand-600)] transition-colors">
                                                        {ingestMutation.data?.property.address}
                                                    </p>
                                                    <LinkIcon className="h-4 w-4 text-[var(--color-neutral-400)] opacity-0 transition-opacity group-hover:opacity-100" />
                                                </Link>
                                                <p className="text-sm text-[var(--color-neutral-500)]">
                                                    {ingestMutation.data?.property.suburb}, {ingestMutation.data?.property.state} {ingestMutation.data?.property.postcode}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--color-neutral-100)] pt-6">
                                            <div>
                                                <p className="text-xs font-medium text-[var(--color-neutral-500)]">Estimated Price</p>
                                                <p className="text-lg font-semibold text-[var(--color-neutral-900)]">
                                                    ${ingestMutation.data?.property.price?.toLocaleString() || "TBD"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[var(--color-neutral-500)]">Listing Type</p>
                                                <span className="mt-1 inline-flex items-center rounded-full bg-[var(--color-brand-50)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand-700)]">
                                                    Off-Market
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Match Results Card */}
                                <div className="rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface-0)] p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-[var(--color-neutral-700)]" />
                                            <h3 className="font-semibold text-[var(--color-neutral-900)]">Potential Buyers</h3>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                                            {ingestMutation.data?.matchedClientIds.length} Matches Found
                                        </span>
                                    </div>

                                    {ingestMutation.data?.matchedClientIds.length > 0 ? (
                                        <div className="space-y-3">
                                            {ingestMutation.data?.matchedClientIds.map((clientId, i) => (
                                                <div key={clientId} className="flex items-center justify-between rounded-lg border border-[var(--color-neutral-100)] bg-[var(--surface-50)] p-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-medium text-[var(--color-brand-700)]">
                                                            #{i + 1}
                                                        </div>
                                                        <p className="text-sm font-medium text-[var(--color-neutral-900)]">Client ID: ...{clientId.slice(-4)}</p>
                                                    </div>
                                                    <span className="text-xs font-medium text-[var(--color-brand-600)]">View Match →</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[var(--color-neutral-500)]">No matches found in your active client roster.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

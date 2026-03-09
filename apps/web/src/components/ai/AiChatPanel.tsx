"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { SAFE_AI_COPY } from "@/lib/safe-ai";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    action?: {
        type: string;
        payload: {
            type?: "CLIENTS" | "PROPERTIES";
            data?: unknown[];
            path?: string;
        };
    };
}

export function AiChatPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content:
                "Hi! I'm your BuyerOS Assistant. I can help with platform workflows and data navigation. I cannot provide legal, financial, or credit advice.",
        },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const chatMutation = trpc.aiAssistant.chat.useMutation({
        onSuccess: (data) => {
            const assistantMessage: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: data.response,
                action: data.action ? {
                    type: data.action.type,
                    payload: {
                        type: data.action.payload.type,
                        data: data.action.payload.data,
                        path: data.action.payload.path,
                    }
                } : undefined,
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Handle actions automatically for better UX
            if (data.action?.type === "NAVIGATION" && data.action.payload.path) {
                const targetPath = data.action.payload.path;
                setTimeout(() => {
                    router.push(targetPath);
                }, 1500);
            }
        },
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || chatMutation.isPending) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        chatMutation.mutate({ message: input });
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <Sparkles className="h-6 w-6" />
                </motion.button>
            )}

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-white/20 p-1">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">BuyerOS AI</h3>
                                    <p className="text-[10px] text-indigo-100">{SAFE_AI_COPY.assistant.title}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-1 hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
                            <p className="text-[10px] leading-relaxed text-slate-600">
                                {SAFE_AI_COPY.assistant.body}
                            </p>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4"
                        >
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${message.role === "user"
                                            ? "bg-indigo-600 text-white"
                                            : "bg-white text-slate-700 border border-slate-100"
                                            }`}
                                    >
                                        {message.content}

                                        {message.action?.type === "DATA_DISPLAY" && (
                                            <div className="mt-2 space-y-2 border-t border-slate-100 pt-2 text-xs">
                                                <p className="font-medium text-slate-500">Preview:</p>
                                                {message.action.payload.type === "CLIENTS" ? (
                                                    <div className="space-y-1">
                                                        {(message.action.payload.data as { id: string; firstName: string; lastName: string }[])?.map((c) => (
                                                            <div key={c.id} className="flex items-center justify-between rounded bg-slate-50 p-1 px-2">
                                                                <span>{c.firstName} {c.lastName}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {(message.action.payload.data as { id: string; address: string }[])?.map((p) => (
                                                            <div key={p.id} className="flex items-center justify-between rounded bg-slate-50 p-1 px-2">
                                                                <span className="truncate">{p.address}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {chatMutation.isPending && (
                                <div className="flex justify-start">
                                    <div className="flex gap-1 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-100">
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"></span>
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0.2s" }}></span>
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0.4s" }}></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={handleSubmit}
                            className="border-t border-slate-200 bg-white p-4"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || chatMutation.isPending}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

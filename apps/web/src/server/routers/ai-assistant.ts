import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc/server";
import { listClients, listProperties } from "@/server/data/data-access";

const chatInput = z.object({
    message: z.string(),
});

export const aiAssistantRouter = router({
    chat: protectedProcedure
        .input(chatInput)
        .mutation(async ({ input, ctx }): Promise<{
            response: string;
            action?: {
                type: "DATA_DISPLAY" | "NAVIGATION";
                payload: {
                    type?: "CLIENTS" | "PROPERTIES";
                    data?: unknown[];
                    path?: string;
                };
            };
        }> => {
            const { message } = input;
            const { session } = ctx;
            const query = message.toLowerCase();

            if (
                query.includes("legal advice") ||
                query.includes("financial advice") ||
                query.includes("credit") ||
                query.includes("mortgage recommendation")
            ) {
                return {
                    response:
                        "I can help with platform workflows and data, but I cannot provide legal, financial, or credit advice. Please refer this to a licensed professional.",
                };
            }

            if (query.includes("client") || query.includes("people")) {
                const clients = await listClients(session);
                return {
                    response: `I found ${clients.length} clients in your system. Would you like me to show you the shortlist?`,
                    action: { type: "DATA_DISPLAY", payload: { type: "CLIENTS", data: clients.slice(0, 3) } },
                };
            }

            if (query.includes("dashboard") || query.includes("home")) {
                return {
                    response: "Navigating to your dashboard now.",
                    action: { type: "NAVIGATION", payload: { path: "/overview" } },
                };
            }

            if (query.includes("property") || query.includes("house") || query.includes("listings")) {
                const properties = await listProperties(session, {});
                return {
                    response: `You have ${properties.length} properties tracked. I can filter them by risk score or budget if you'd like.`,
                    action: { type: "DATA_DISPLAY", payload: { type: "PROPERTIES", data: properties.slice(0, 3) } },
                };
            }

            if (query.includes("off-market") || query.includes("workbench")) {
                return {
                    response: "Opening the Off-Market Workbench for you.",
                    action: { type: "NAVIGATION", payload: { path: "/off-market" } },
                };
            }

            return {
                response: "I'm your BuyerOS assistant. I can help you find clients, properties, or navigate the platform. Try asking 'Show me my clients' or 'Go to dashboard'.",
            };
        }),
});

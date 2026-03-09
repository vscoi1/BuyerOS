export const DEMO_USERS = {
    demo_admin: {
        id: "agent_demo_admin",
        name: "Alex Chen",
        email: "admin@buyersos.au",
        role: "ADMIN" as const,
        organizationId: "org_demo",
    },
    demo_agent: {
        id: "agent_demo_agent",
        name: "Sarah Williams",
        email: "agent@buyersos.au",
        role: "AGENT" as const,
        organizationId: "org_demo",
    },
    demo_assistant: {
        id: "agent_demo_assistant",
        name: "Jordan Lee",
        email: "assistant@buyersos.au",
        role: "ASSISTANT" as const,
        organizationId: "org_demo",
    },
} as const;

export type DemoUserId = keyof typeof DEMO_USERS;

import { headers } from "next/headers";

export interface Session {
  organizationId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "AGENT" | "ASSISTANT";
  };
}

export async function auth(): Promise<Session | null> {
  const h = await headers();
  const demoUser = h.get("x-demo-user");

  if (demoUser === "anonymous") {
    return null;
  }

  return {
    organizationId: "org_demo",
    user: {
      id: "agent_demo_1",
      name: "BuyerOS Demo Agent",
      email: "agent@buyersos.au",
      role: "ADMIN",
    },
  };
}

import { cookies } from "next/headers";
import { DEMO_USERS, type DemoUserId } from "@/lib/demo-users";

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
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("buyeros-session");

  if (!sessionCookie?.value) {
    return null;
  }

  const demoUser = DEMO_USERS[sessionCookie.value as DemoUserId];
  if (!demoUser) {
    return null;
  }

  return {
    organizationId: demoUser.organizationId,
    user: {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
    },
  };
}

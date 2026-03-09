import { describe, it, expect } from "vitest";
import { createClient, createPortalSession, resolvePortalSession } from "./data-access";

const session = {
  organizationId: "org_portal_security",
  user: {
    id: "agent_portal_security",
    email: "portal-security@test.com",
    name: "Portal Security",
    role: "AGENT" as const,
  },
};

async function createTestClient() {
  return createClient(session, {
    firstName: "Portal",
    lastName: "Client",
    email: `portal.client.${Date.now()}@example.com`,
    budgetMin: 600_000,
    budgetMax: 900_000,
    targetSuburbs: ["Richmond"],
    briefSummary: "Portal session security test client with valid brief summary.",
  });
}

describe("Portal session security", () => {
  it("invalidates old token when rotating sessions", async () => {
    const client = await createTestClient();

    const first = await createPortalSession(session, { clientId: client.id });
    const rotated = await createPortalSession(session, {
      clientId: client.id,
      rotateExisting: true,
    });

    const oldResult = await resolvePortalSession(first.token);
    const rotatedResult = await resolvePortalSession(rotated.token);

    expect(oldResult).toBeNull();
    expect(rotatedResult).toEqual(
      expect.objectContaining({
        clientId: client.id,
        organizationId: session.organizationId,
        agentId: session.user.id,
      }),
    );
  });

  it("consumes one-time token after first successful resolve", async () => {
    const client = await createTestClient();

    const oneTime = await createPortalSession(session, {
      clientId: client.id,
      oneTime: true,
      ttlHours: 1,
    });

    const firstResolve = await resolvePortalSession(oneTime.token);
    const secondResolve = await resolvePortalSession(oneTime.token);

    expect(firstResolve).toEqual(
      expect.objectContaining({
        clientId: client.id,
        organizationId: session.organizationId,
        agentId: session.user.id,
      }),
    );
    expect(secondResolve).toBeNull();
  });
});

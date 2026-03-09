import { describe, it, expect } from "vitest";
import {
  createClient,
  createProperty,
  issuePortalSessionForClient,
  listPortalDocumentsForClient,
  listPortalPortfolioProjection,
  listPortalShortlistForClient,
  registerPortalDocumentUpload,
  resolvePortalSession,
} from "./data-access";

const agentSession = {
  organizationId: "org_portal_experience",
  user: {
    id: "agent_portal_experience",
    email: "agent.portal.experience@test.com",
    name: "Portal Experience Agent",
    role: "AGENT" as const,
  },
};

describe("Portal client experience", () => {
  it("keeps shortlist and projections scoped to the logged-in client", async () => {
    const clientA = await createClient(agentSession, {
      firstName: "Client",
      lastName: "A",
      email: `portal.a.${Date.now()}@example.com`,
      budgetMin: 700_000,
      budgetMax: 950_000,
      targetSuburbs: ["Richmond"],
      briefSummary: "Client A portal scope validation with sufficient description.",
    });

    const clientB = await createClient(agentSession, {
      firstName: "Client",
      lastName: "B",
      email: `portal.b.${Date.now()}@example.com`,
      budgetMin: 900_000,
      budgetMax: 1_300_000,
      targetSuburbs: ["Northcote"],
      briefSummary: "Client B portal scope validation with sufficient description.",
    });

    await createProperty(agentSession, {
      clientId: clientA.id,
      address: "11 Scope St",
      suburb: "Richmond",
      state: "VIC",
      postcode: "3121",
      stage: "SHORTLISTED",
      isOffMarket: false,
      price: 880_000,
    });

    await createProperty(agentSession, {
      clientId: clientB.id,
      address: "22 Isolation Ave",
      suburb: "Northcote",
      state: "VIC",
      postcode: "3070",
      stage: "SHORTLISTED",
      isOffMarket: false,
      price: 1_120_000,
    });

    const issued = await issuePortalSessionForClient({
      clientId: clientA.id,
      organizationId: agentSession.organizationId,
      agentId: agentSession.user.id,
    });

    const portalContext = await resolvePortalSession(issued.token);
    expect(portalContext).toBeTruthy();

    const shortlist = await listPortalShortlistForClient(portalContext!);
    const projections = await listPortalPortfolioProjection(portalContext!);

    expect(shortlist.length).toBe(1);
    expect(shortlist[0]!.clientId).toBe(clientA.id);
    expect(projections.length).toBe(1);
    expect(projections[0]!.projectedValue10Y).toBeGreaterThan(projections[0]!.currentValue);
  });

  it("allows client uploads only for their own properties", async () => {
    const client = await createClient(agentSession, {
      firstName: "Upload",
      lastName: "Client",
      email: `portal.upload.${Date.now()}@example.com`,
      budgetMin: 800_000,
      budgetMax: 1_000_000,
      targetSuburbs: ["Brunswick"],
      briefSummary: "Portal upload test client with sufficient detail.",
    });

    const ownProperty = await createProperty(agentSession, {
      clientId: client.id,
      address: "14 Upload Rd",
      suburb: "Brunswick",
      state: "VIC",
      postcode: "3056",
      stage: "SEARCHING",
      isOffMarket: false,
      price: 940_000,
    });

    const otherClient = await createClient(agentSession, {
      firstName: "Other",
      lastName: "Client",
      email: `portal.other.${Date.now()}@example.com`,
      budgetMin: 600_000,
      budgetMax: 900_000,
      targetSuburbs: ["Fitzroy"],
      briefSummary: "Other portal upload test client with sufficient detail.",
    });

    const otherProperty = await createProperty(agentSession, {
      clientId: otherClient.id,
      address: "99 Forbidden Pl",
      suburb: "Fitzroy",
      state: "VIC",
      postcode: "3065",
      stage: "SEARCHING",
      isOffMarket: false,
      price: 860_000,
    });

    const issued = await issuePortalSessionForClient({
      clientId: client.id,
      organizationId: agentSession.organizationId,
      agentId: agentSession.user.id,
    });
    const portalContext = await resolvePortalSession(issued.token);
    expect(portalContext).toBeTruthy();

    await registerPortalDocumentUpload(
      portalContext!,
      {
        propertyId: ownProperty.id,
        fileName: "Client-Upload.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
      },
      `documents/portal-upload-${Date.now()}.pdf`,
    );

    const docs = await listPortalDocumentsForClient(portalContext!);
    expect(docs.length).toBeGreaterThan(0);

    await expect(
      registerPortalDocumentUpload(
        portalContext!,
        {
          propertyId: otherProperty.id,
          fileName: "Should-Fail.pdf",
          mimeType: "application/pdf",
          sizeBytes: 2048,
        },
        `documents/portal-forbidden-${Date.now()}.pdf`,
      ),
    ).rejects.toThrow("NOT_FOUND");
  });
});

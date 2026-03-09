import { describe, it, expect } from "vitest";
import {
  createProperty,
  registerDocumentUpload,
  listDocuments,
  extractDocumentRedFlags,
  generateDealKillerReport,
  updateRedFlagStatus,
} from "./data-access";

const session = {
  organizationId: "org_deal_killer_tests",
  user: {
    id: "agent_deal_killer_tests",
    email: "deal-killer@test.com",
    name: "Deal Killer Tester",
    role: "AGENT" as const,
  },
};

describe("Deal Killer approval gate", () => {
  it("blocks client-ready conclusions when findings are unreviewed", async () => {
    const property = await createProperty(session, {
      address: "12 Review St",
      suburb: "Northcote",
      state: "VIC",
      postcode: "3070",
      stage: "DUE_DILIGENCE",
      isOffMarket: false,
      price: 1_050_000,
    });

    await registerDocumentUpload(
      session,
      {
        propertyId: property.id,
        fileName: "Building-Report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 4096,
      },
      `documents/deal-killer-${Date.now()}.pdf`,
    );

    const docs = await listDocuments(session, property.id);
    const extracted = await extractDocumentRedFlags(session, docs[0]!.id);
    expect(extracted.length).toBeGreaterThan(0);

    const generated = await generateDealKillerReport(session, property.id);

    expect(generated.flagsCount).toBe(0);
    expect(generated.pendingReviewCount).toBeGreaterThan(0);
    expect(generated.report.dealKillers.length).toBe(0);
    expect(generated.report.summary).toContain("Review required");
  });

  it("uses approved findings once human review is completed", async () => {
    const property = await createProperty(session, {
      address: "44 Approved Ave",
      suburb: "Mosman",
      state: "NSW",
      postcode: "2088",
      stage: "DUE_DILIGENCE",
      isOffMarket: true,
      price: 1_900_000,
    });

    await registerDocumentUpload(
      session,
      {
        propertyId: property.id,
        fileName: "Strata-Report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 4096,
      },
      `documents/deal-killer-approved-${Date.now()}.pdf`,
    );

    const docs = await listDocuments(session, property.id);
    const extracted = await extractDocumentRedFlags(session, docs[0]!.id);
    expect(extracted.length).toBeGreaterThan(0);

    await updateRedFlagStatus(session, extracted[0]!.id, "APPROVED");

    const generated = await generateDealKillerReport(session, property.id);

    expect(generated.flagsCount).toBeGreaterThan(0);
    expect(generated.pendingReviewCount).toBeGreaterThanOrEqual(0);
    expect(generated.report.overallRisk).toBe("CATASTROPHIC");
    expect(generated.report.dealKillers.length).toBeGreaterThan(0);
  });
});
